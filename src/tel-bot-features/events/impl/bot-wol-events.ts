import { Markup, Context } from 'telegraf';
import { AbstractBotEvents } from '../bot-events.abstract';
import wolService from '../../../services/wol.service';
import authService from '../../../services/auth.service';

export class BotWolEvents extends AbstractBotEvents {

  onInit(): void {
    if (!this.userConfig.initMessage) return;
    for (const userId of authService.authorizedTeluserIds) {
      this.bot.telegram.sendMessage(userId, 'Mock init message');
    }
  }

  deployActionsAndEvents(): void {
    this.startEvent();
    this.debugEvent();
  }

  startEvent() {
    this.bot.start((ctx: Context) => {
      super.logEvent('start');
      
      const devices = this.userConfig.devices;

      if (!devices || devices.length === 0) {
        return ctx.reply(ctx.state.t('telegram_bot.error.no_devices_in_config'));
      }

      const buttons = devices.map(device => {
        return [
          Markup.button.callback(
              ctx.state.t('telegram_bot.wol.device', { name: device.nameId }),
              `wake_${device.nameId}|${this.eventSession}`
          )
        ];
      });

      ctx.reply(
        ctx.state.t('telegram_bot.wol.select_wake_device'),
        Markup.inlineKeyboard(buttons)
      );
    });

    // Buttons action
    this.bot.action(/^wake_([^|]+)\|(.+)$/, async (ctx) => {
      const requestedNameId = ctx.match[1];      
      const sessionString = ctx.match[2];

      if (!this.checkEventSession(sessionString)) {
        ctx.reply('Escribe /start para obtener un mensaje actualizado');
        return ctx.answerCbQuery('❌ Este mensaje es de otra sesión y está desactualizado', { show_alert: true });
      }
      
      const device = this.userConfig.devices.find(d => d.nameId === requestedNameId);

      if (!device) {
        return ctx.answerCbQuery('❌ Dispositivo no encontrado en la configuración', { show_alert: true });
      }

      try {
        // await wolService.wakeDevice(device.macAddress);
        await ctx.answerCbQuery(`✅ Magic Packet enviado a ${device.nameId}`);
        
      } catch (error: any) {
        console.error(error);
        await ctx.answerCbQuery('❌ Error al intentar enviar la señal WoL', { show_alert: true });
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
