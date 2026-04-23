import { Telegraf } from 'telegraf';
import { telauthMiddleware } from './middlewares/tel-auth.middleware';
import { telnotAllowedCommandMiddleware } from './middlewares/tel-not-allowed-command.middleware';
import { teli18nMiddleware } from './middlewares/tel-i18n.middleware';
import { AbstractBotEvents, BotEvent } from './events/bot-events.abstract';

/**
 * BotHandler is the main orchestrator for the Telegram bot's lifecycle.
 * It manages initialization, the middleware pipeline, event registration, 
 * and safe process termination.
 */
export class BotHandler {
  private readonly bot: Telegraf;
  private readonly botEvents: AbstractBotEvents;
  private isLaunched: boolean = false;

  /**
   * @param telbotToken - The secret token provided by Telegram's BotFather.
   * @param BotEventClass - A class extending AbstractBotEvents.
   */
  constructor(telbotToken: string, BotEventClass: BotEvent) {
    this.bot = new Telegraf(telbotToken);
    this.botEvents = new BotEventClass(this.bot);
    this.gracefulStopWhenExit();
  }

  /**
   * Bootstraps the bot by applying global rules (middlewares) and 
   * starting the Telegraf polling mechanism to listen for incoming messages.
   */
  init() {
    this.addBotMiddlewares();
    this.bot.launch();
    this.isLaunched = true;
  }

  /**
   * Activates the specific commands and event listeners for the bot.
   */
  enableFeature() {
    if (!this.isLaunched) {
      throw new Error('Bot not launched yet');
    }
    console.log(
      `[BotHandler] Telegram bot events ('${this.botEvents.constructor.name}') are being deployed`,
    );
    this.botEvents.deployActionsAndEvents();
  }

  /**
   * Ensures the bot safely drops the Telegram API connection.
   */
  private gracefulStopWhenExit() {
    process.once('SIGINT', () => {
      this.bot.stop('SIGINT');
      console.log('Bot gracefully stopped');
    });
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  /**
   * Registers the middleware pipeline. 
   * NOTE: The order of insertion here is critical!
   */
  private addBotMiddlewares() {
    this.bot.use(
      telauthMiddleware(),
      teli18nMiddleware(),
      telnotAllowedCommandMiddleware(),
    );
  }
}
