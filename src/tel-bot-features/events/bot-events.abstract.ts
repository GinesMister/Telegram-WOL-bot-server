import { Telegraf } from 'telegraf';
import 'dotenv/config';

export type BotEvent = new (bot: Telegraf) => AbstractBotEvents;

export abstract class AbstractBotEvents {
  protected readonly bot: Telegraf;

  constructor(bot: Telegraf) {
    this.bot = bot;
  }

  abstract start(): void;

  abstract deployEvents(): void;

  protected logEvent(eventName: string): void {
    console.log(`[Bot Event]: Event executed ${eventName} at ${new Date().toISOString()}`);
  }
}
