import { Markup, Context } from 'telegraf';
import { AbstractBotEvents } from '../bot-events.abstract';
import wolService from '../../../services/wol.service';
import authService from '../../../services/auth.service';
import configService from '../../../services/config.service';

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

  private wolButtonsAction() {
    this.bot.action(/^wake_([^|]+)\|(.+)$/, async (ctx) => {

      const requestedNameId = ctx.match[1];
      const sessionString = ctx.match[2];

      // If the button pressed is from an other session message
      if (!this.checkEventSession(sessionString)) {
        const newSessionMessage = await ctx.reply(
          ctx.state.t('telegram_bot.global.info_get_new_session_message'),
        );
        setTimeout(() => {
          if (newSessionMessage)
            ctx.telegram
              .deleteMessage(ctx.chat!.id, newSessionMessage.message_id)
              .catch((e) =>
                console.warn(
                  `[BotWolEvents] ⚠️ Unable to delete message (ID: ${newSessionMessage.message_id}):
                    ${e.description || 'Unknown reason'}`,
                ),
              );
        }, 10000);
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
