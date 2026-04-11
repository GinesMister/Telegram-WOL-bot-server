import { Telegraf } from 'telegraf';
import { BotEvents } from './botEvents';
import { authGuard } from '../middlewares/telauth.middleware';

export class BotHandler {
  private readonly bot: Telegraf;
  private readonly botEvents: BotEvents;
  private isLaunched: boolean = false;

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    if (!botToken) throw new Error('Telegram bot token not in .env');
    this.bot = new Telegraf(botToken);
    this.botEvents = new BotEvents(this.bot);
    this.gracefulStopWhenExit();
  }

  launch = () => {
    this.bot.launch();
    this.isLaunched = true;
  };

  deployEvents = () => {
    if (!this.isLaunched) {
      throw new Error('bot not launched yet');
    }
    this.bot.use(authGuard());
    console.log('Events are being deployed');
    this.botEvents.start();
  };

  private gracefulStopWhenExit = () => {
    process.once('SIGINT', () => {
      this.bot.stop('SIGINT');
      console.log('Bot gracefully stopped');
    });
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  };
}
