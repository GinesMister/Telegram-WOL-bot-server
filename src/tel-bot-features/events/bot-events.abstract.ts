import { Telegraf } from 'telegraf';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { UserConfig } from '../../types/user-config.type';
import configService from '../../services/config.service';

export type BotEvent = new (bot: Telegraf) => AbstractBotEvents;

export abstract class AbstractBotEvents {
  protected readonly bot: Telegraf;
  readonly eventSession: string;
  protected readonly userConfig: UserConfig

  constructor(bot: Telegraf) {
    this.userConfig = configService.getConfig();
    this.bot = bot;
    this.eventSession = randomUUID();
    this.onInit();
  }

  abstract onInit(): void;

  abstract startEvent(): void;

  abstract deployActionsAndEvents(): void;

  protected logEvent(eventName: string): void {
    console.log(
      `[${this.constructor.name}]: Event executed '${eventName}' at ${new Date().toISOString()}`,
    );
  }

  protected checkEventSession(textWithSessionIncluded: string): boolean {
    const extractedSession = textWithSessionIncluded.split('|').pop()?.trim();
    return extractedSession === this.eventSession;
  }
}
