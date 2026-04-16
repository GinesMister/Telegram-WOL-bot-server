import { Markup, Context } from 'telegraf';
import { AbstractBotEvents } from '../bot-events.abstract';
import wolService from '../../../services/wol.service';
import configService from '../../../services/config.service';
import authService from '../../../services/auth.service';
import { UserConfig } from '../../../types/user-config.type';

export class BotWolEvents extends AbstractBotEvents {
  private userConfig: UserConfig | undefined;

  onInit(): void {
    this.userConfig = configService.getConfig();
    this.logEvent('init');
    if (!this.userConfig.initMessage) return;
    for (const userId of authService.authorizedTeluserIds) {
      this.bot.telegram.sendMessage(userId, 'Mock init message');
    }
  }

  start() {
    this.bot.start((ctx: Context) => {
      super.logEvent('start');
      ctx.reply(
        '¡Hola! Bienvenido a nuestro servicio. Por favor, elige una opción del menú:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🍕 Pedir Comida', 'menu_comida')],
          [
            Markup.button.callback('📞 Contacto', 'menu_contacto'),
            Markup.button.callback('❓ Ayuda', 'menu_ayuda'),
          ],
        ]),
      );
    });
  }

  private debug() {
    this.bot.command('debug', () => {
      super.logEvent('/debug');
      wolService.isDeviceAwake('192.168.1.78').then((r) => {
        console.debug(`Ping result`, { r });
      });
    });
  }

  deployEvents(): void {
    this.start();
    this.debug();
  }
}
