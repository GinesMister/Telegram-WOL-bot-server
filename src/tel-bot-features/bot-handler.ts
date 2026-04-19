import { Telegraf } from 'telegraf';
import { telauthMiddleware } from './middlewares/tel-auth.middleware';
import { telnotAllowedCommandMiddleware } from './middlewares/tel-not-allowed-command.middleware';
import { teli18nMiddleware } from './middlewares/tel-i18n.middleware';
import { AbstractBotEvents, BotEvent } from './events/bot-events.abstract';

export class BotHandler {
  private readonly bot: Telegraf;
  private readonly botEvents: AbstractBotEvents;
  private isLaunched: boolean = false;

  constructor(telbotToken: string, BotEventClass: BotEvent) {
    this.bot = new Telegraf(telbotToken);
    this.botEvents = new BotEventClass(this.bot);
    this.gracefulStopWhenExit();
  }

  init() {
    this.addBotMiddlewares();
    this.bot.launch();
    this.isLaunched = true;
  }

  enableFeature() {
    if (!this.isLaunched) {
      throw new Error('Bot not launched yet');
    }
    console.log(
      `[BotHandler] Telegram bot events ('${this.botEvents.constructor.name}') are being deployed`,
    );
    this.botEvents.deployActionsAndEvents();
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
      telnotAllowedCommandMiddleware(),
    );
  }
}
