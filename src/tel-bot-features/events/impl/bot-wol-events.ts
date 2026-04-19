import { Markup, Context } from 'telegraf';
import { AbstractBotEvents } from '../bot-events.abstract';
import wolService from '../../../services/wol.service';
import authService from '../../../services/auth.service';
import configService from '../../../services/config.service';
import { deleteMessage, deleteMessageAfter } from '../../../util/tel-messages.util';
import { telCommands } from '../../../constants/tel-commands.const';

export class BotWolEvents extends AbstractBotEvents {
  protected onInit(): void {
    if (!this.userConfig.initMessage || this.userConfig.initMessage === '') return;
    console.log(`[BotWolEvents] Sending init message...`);
    for (const userId of authService.authorizedTeluserIds) {
      this.bot.telegram.sendMessage(userId, this.userConfig.initMessage);
    }
  }

  deployActionsAndEvents(): void {
    this.startEvent();
    this.debugEvent();
    this.wolButtonsAction();
    this.pingEvent();
  }

  protected startEvent() {
    this.bot.start((ctx: Context) => {
      super.logEvent('start');

      const devices = configService.getDevicesByAuthorizedTelUsername(ctx.from?.username);
      if (devices.length === 0) {
        return ctx.reply(ctx.state.t('telegram_bot.error.no_devices_in_config'));
      }

      const buttons = devices.map((device) => {
        return [
          Markup.button.callback(
            ctx.state.t('telegram_bot.wol.device', { device: device.nameId }),
            `wake_${device.nameId}|${this.eventSession}`,
          ),
        ];
      });

      ctx.reply(
        ctx.state.t('telegram_bot.wol.select_wake_device'),
        Markup.inlineKeyboard(buttons),
      );
    });
  }

  private pingEvent() {
    this.bot.command(telCommands.ping, (ctx) => {
      this.logEvent(telCommands.ping);
      const cooldownSecs = this.checkDelayedCommand(telCommands.ping);
      if (cooldownSecs > 0) {
        ctx
          .reply(
            ctx.state.t('telegram_bot.global.command_on_cooldown', {
              command: telCommands.ping,
              secs: cooldownSecs,
            }),
          )
          .then((r) => deleteMessageAfter(5000, ctx, r.message_id, 'BotWolEvents'))
          .then(() => deleteMessage(ctx, ctx.message.message_id, 'BotWolEvents'));
        return;
      }

      const device = configService
        .getDevicesByAuthorizedTelUsername(ctx.from?.username)
        .find((d) => d.nameId === ctx.payload);
      if (!device) {
        ctx.reply(ctx.state.t('telegram_bot.error.device_not_found_in_config'));
        return;
      }
      wolService.isDeviceAwake(device?.ipAddress).then((r) => {
        if (!r) {
          ctx.reply(
            ctx.state.t('telegram_bot.wol.ping_failed', { device: device.nameId }),
          );
          return;
        }
        ctx.reply(
          ctx.state.t('telegram_bot.wol.device_awaked', { device: device.nameId }),
        );
      });
    });
  }

  private wolButtonsAction() {
    this.bot.action(/^wake_([^|]+)\|(.+)$/, async (ctx) => {
      const requestedNameId = ctx.match[1];
      const sessionString = ctx.match[2];

      // If the button pressed is from an other session message
      if (!this.checkEventSession(sessionString)) {
        const newSessionMessage = await ctx.reply(
          ctx.state.t('telegram_bot.global.info_get_new_session_message'),
        );
        deleteMessageAfter(10000, ctx, newSessionMessage.message_id, 'BotWolEvents');
        return ctx.answerCbQuery(ctx.state.t('telegram_bot.error.other_session_button'), {
          show_alert: true,
        });
      }

      // Check user can really wake device
      const device = configService
        .getDevicesByAuthorizedTelUsername(ctx.from?.username)
        .find((d) => d.nameId === requestedNameId);
      if (!device) {
        return ctx.answerCbQuery(
          ctx.state.t('telegram_bot.error.device_not_found_in_config'),
          {
            show_alert: true,
          },
        );
      }

      // WoL
      try {
        await wolService.wakeDevice(device.macAddress);
        await ctx.answerCbQuery(
          ctx.state.t('telegram_bot.wol.magic_packet_sended', { device: device.nameId }),
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(error);
        await ctx.answerCbQuery(
          ctx.state.t('telegram_bot.error.sending_magic_packet_failed'),
          {
            show_alert: true,
          },
        );
      }

      // Auto-ping
      if (!this.userConfig.notificationWhenDeviceIsOn) return;
      const waitingPingMessage = ctx.reply(
        ctx.state.t('telegram_bot.wol.pinging_device', { device: device.nameId }),
      );
      setTimeout(() => {
        const maxAttempts = 20;
        const pingIntervalMs = 4000;
        let attempts = 0;

        const pingInterval = setInterval(() => {
          console.log(`[BotWolEvents] Pinging device with IP '${device.ipAddress}'`);
          wolService.isDeviceAwake(device.ipAddress).then((r) => {
            if (!r) return;
            ctx
              .reply(
                ctx.state.t('telegram_bot.wol.device_awaked', { device: device.nameId }),
              )
              .then((r) => {
                deleteMessageAfter(30000, ctx, r.message_id, 'BotWolEvents');
              });
            waitingPingMessage.then((r) => {
              deleteMessage(ctx, r.message_id, '[BotWolEvents]');
            });

            clearInterval(pingInterval);
            return;
          });
          if (++attempts >= maxAttempts) {
            waitingPingMessage.then((r) => {
              deleteMessage(ctx, r.message_id, '[BotWolEvents]');
            });
            ctx.reply(
              ctx.state.t('telegram_bot.wol.ping_failed', { device: device.nameId }),
            );
            clearInterval(pingInterval);
          }
        }, pingIntervalMs);
      }, 13000);
    });
  }

  private debugEvent() {
    this.bot.command('debug', () => {
      super.logEvent('/debug');
      wolService.isDeviceAwake('192.168.1.78').then((r) => {
        console.debug(`Ping result`, { r });
      });
    });
  }
}
