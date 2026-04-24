import { Markup, Context } from 'telegraf';
import { AbstractBotEvents } from '../bot-events.abstract';
import wolService from '../../../services/wol.service';
import authService from '../../../services/auth.service';
import configService from '../../../services/config.service';
import { deleteMessage, deleteMessageAfter } from '../../../util/tel-messages.util';
import { telCommands } from '../../../constants/tel-commands.const';

/**
 * Implements the specific Telegram commands and button actions
 * required for the Wake-on-LAN functionality.
 */
export class BotWolEvents extends AbstractBotEvents {
  // State tracker to prevent sending multiple Magic Packets or triggering overlapping
  // ping intervals if a user spams the "Wake" button for the same device.
  private wakingDevices: Array<string> = [];

  /**
   * Fired immediately upon class initialization.
   */
  protected onInit(): void {
    if (!this.userConfig.initMessage || this.userConfig.initMessage === '') return;
    console.log(`[BotWolEvents] Sending init message...`);
    for (const userId of authService.authorizedTeluserIds) {
      this.bot.telegram.sendMessage(userId, this.userConfig.initMessage);
    }
  }

  /**
   * Wires up all the Telegraf listeners.
   */
  deployActionsAndEvents(): void {
    this.startEvent();
    this.debugEvent();
    this.wolButtonsAction();
    this.pingEvent();
    this.helpEvent();
    this.devicesEvent();
  }

  protected startEvent() {
    this.bot.start((ctx: Context) => {
      super.logEvent('start');
      this.replyCommands(ctx);
      this.replyDevices(ctx);
    });
  }

  private helpEvent() {
    this.bot.command(telCommands.help, (ctx) => {
      this.replyCommands(ctx);
    });
  }

  private devicesEvent() {
    this.bot.command(telCommands.devices, (ctx) => {
      this.replyDevices(ctx);
    });
  }

  /**
   * Allows users to manually check if a device is online.
   */
  private pingEvent() {
    this.bot.command(telCommands.ping, (ctx) => {
      this.logEvent(telCommands.ping);

      // Check if the command is on cooldown
      const cooldownSecs = this.checkDelayedCommand(telCommands.ping);
      if (cooldownSecs > 0) {
        ctx
          .reply(
            ctx.state.t('telegram_bot.global.command_on_cooldown', {
              command: telCommands.ping,
              secs: cooldownSecs,
            }),
          )
          .then((r) =>
            deleteMessageAfter(cooldownSecs * 1000, ctx, r.message_id, 'BotWolEvents'),
          )
          .then(() => deleteMessage(ctx, ctx.message.message_id, 'BotWolEvents'));
        return;
      }

      // Validate the requested device exists and the user is authorized for it
      const device = configService
        .getDevicesByAuthorizedTelUsername(ctx.from?.username)
        .find((d) => d.nameId.toLocaleLowerCase() === ctx.payload.toLocaleLowerCase());
      if (!device) {
        ctx.reply(ctx.state.t('telegram_bot.error.device_not_found_in_config'));
        return;
      }
      if (device.ipAddress === '') {
        ctx.reply(ctx.state.t('telegram_bot.error.no_ip_for_device_in_config'));
        return;
      }

      // Execute the ping and reply with the result
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

  /**
   * Listens for clicks on the inline "Wake" buttons.
   */
  private wolButtonsAction() {
    this.bot.action(/^wake_([^|]+)\|(.+)$/, async (ctx) => {
      this.logEvent('wake_action');
      const requestedNameId = ctx.match[1];
      const session = ctx.match[2];

      // If the button pressed is from an other session message
      if (!this.checkEventSession(session)) {
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

      if (this.wakingDevices.find((d) => d === device.nameId)) {
        ctx.answerCbQuery(
          ctx.state.t('telegram_bot.wol.device_is_waking', { device: device.nameId }),
        );
        return;
      }

      // --- Wake-on-LAN process ---
      // Ping to check if device is already waked (no WoL needed)
      if (device.ipAddress && await wolService.isDeviceAwake(device.ipAddress)) {
        ctx.answerCbQuery(
          ctx.state.t('telegram_bot.wol.device_awaked', { device: device.nameId })
        );
        return;
      }
      try {
        await wolService.wakeDevice(device.macAddress);
        await ctx.answerCbQuery(
          ctx.state.t('telegram_bot.wol.magic_packet_sended', { device: device.nameId }),
        );
        this.wakingDevices.push(device.nameId);
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

      // --- Auto-ping ---
      if (!this.userConfig.notificationWhenDeviceIsOn || device.ipAddress === '') {
        setTimeout(() => {
          this.wakingDevices = this.wakingDevices.filter((d) => d !== device.nameId);
        }, 10000);
        return;
      }
      const waitingPingMessage = ctx.reply(
        ctx.state.t('telegram_bot.wol.pinging_device', { device: device.nameId }),
      );

      // Wait time for the device to wake
      const timeToStartPinging = 13000;
      setTimeout(() => {
        const maxAttempts = 20;
        const pingIntervalMs = 4000;
        let attempts = 0;

        const pingInterval = setInterval(() => {
          wolService.isDeviceAwake(device.ipAddress).then((pingResult) => {
            if (!pingResult) {
              if (++attempts >= maxAttempts) {
                // PC never woke up
                waitingPingMessage.then((r) => {
                  deleteMessage(ctx, r.message_id, '[BotWolEvents]');
                });
                ctx.reply(
                  ctx.state.t('telegram_bot.wol.ping_failed', {
                    device: device.nameId,
                  }),
                );
                this.wakingDevices = this.wakingDevices.filter(
                  (d) => d !== device.nameId,
                );
                clearInterval(pingInterval);
              }
              return;
            }

            // PC woke up
            ctx
              .reply(
                ctx.state.t('telegram_bot.wol.device_awaked', {
                  device: device.nameId,
                }),
              )
              .then((r) => {
                // Delete the success message to keep the chat tidy
                deleteMessageAfter(60000, ctx, r.message_id, 'BotWolEvents');
              });
            waitingPingMessage.then((r) => {
              deleteMessage(ctx, r.message_id, '[BotWolEvents]');
            });
            this.wakingDevices = this.wakingDevices.filter((d) => d !== device.nameId);
            clearInterval(pingInterval);
          });
        }, pingIntervalMs);
      }, timeToStartPinging);
    });
  }

  private debugEvent() {
    this.bot.command('debug', () => {});
  }

  /** Helper method to display available commands */
  private replyCommands(ctx: Context) {
    let replyMessage = `${ctx.state.t('telegram_bot.global.available_commands')}\n\n`

    const allowedCommands = configService.getCommandsAllowedByTelUsername(ctx.from?.username);
    for (const command of allowedCommands) {
      if (command === 'debug') continue;
      replyMessage += `${ctx.state.t('telegram_bot.global.command_description.' + command)}\n`;
    }
    ctx.reply(replyMessage);
  }

  /** Helper method to generate inline buttons for each authorized device */
  private replyDevices(ctx: Context) {
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
  }
}
