import { Telegraf } from 'telegraf';
import { BotEvents } from './botEvents';
import { authGuard } from '../guards/telauth.guard';

export class botHandler {
  private readonly bot: Telegraf;
  private readonly botEvents: BotEvents;
  private isLaunched: boolean = false;

  constructor(telegramBotToken: string) {
    this.bot = new Telegraf(telegramBotToken);
    this.botEvents = new BotEvents(this.bot);
    this.cleanStopWhenExit();
  }

  launch = async () => {
    await this.bot.launch();
    this.isLaunched = true;
  };

  deployEvents = () => {
    if (!this.isLaunched) {
      throw new Error('bot not launched yet');
    }
    this.bot.use(authGuard());
    this.botEvents.start();
  };

  private cleanStopWhenExit = () => {
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  };
}
