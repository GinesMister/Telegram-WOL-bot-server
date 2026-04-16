import { Telegraf, Markup } from 'telegraf';
import 'dotenv/config';
import { AbstractBotEvents } from '../bot-events.abstract';

export class BotWolEvents extends AbstractBotEvents {
  
  start() {
    this.bot.start((ctx) => {
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
  };

  deployEvents(): void {
    this.start();
  }
}
