import { Telegraf } from 'telegraf';
import { BotEvents } from './bot-events';
import { telauthMiddleware } from '../middlewares/telegram/tel-auth.middleware';
import { telcleanChatMiddleware } from '../middlewares/telegram/tel-clean-chat.middleware';
import { telnotCommandMessageMiddleware } from '../middlewares/telegram/tel-not-command-message.middleware';
import { teli18nMiddleware } from '../middlewares/telegram/tel-i18n.middleware';

export class BotHandler {
  private readonly bot: Telegraf;
  private readonly botEvents: BotEvents;
  private isLaunched: boolean = false;

  constructor(telbotToken: string) {
    this.bot = new Telegraf(telbotToken);
    this.botEvents = new BotEvents(this.bot);
    this.gracefulStopWhenExit();
  }

  init() {
    this.addBotMiddlewares();
    this.bot.launch();
    this.isLaunched = true;
  }

  deployEvents() {
    if (!this.isLaunched) {
      throw new Error('Bot not launched yet');
    }
    console.log('Telegram events are being deployed');
    this.botEvents.start();
  }

  private gracefulStopWhenExit() {
    process.once('SIGINT', () => {
      this.bot.stop('SIGINT');
      console.log('Bot gracefully stopped');
    });
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  private addBotMiddlewares() {
    this.bot.use(
      telauthMiddleware(),
      teli18nMiddleware(),
      telnotCommandMessageMiddleware(),
      telcleanChatMiddleware(),
    );
  }
}
