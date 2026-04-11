import { Telegraf, Markup } from 'telegraf';
import 'dotenv/config';

export class BotEvents {
  private readonly bot: Telegraf;

  constructor(bot: Telegraf) {
    this.bot = bot;
  }

  start = () => {
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
}
