import { Telegraf } from 'telegraf';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { UserConfig } from '../../types/user-config.type';
import configService from '../../services/config.service';
import { TelCommandValue } from '../../constants/tel-commands.const';

export type BotEvent = new (bot: Telegraf) => AbstractBotEvents;

export abstract class AbstractBotEvents {
  protected readonly bot: Telegraf;
  readonly eventSession: string;
  protected readonly userConfig: UserConfig;
  private commandLastExecuteArr: Array<{ command: TelCommandValue; time: Date }> = [];

  constructor(bot: Telegraf) {
    this.userConfig = configService.getConfig();
    this.bot = bot;
    this.eventSession = randomUUID();
    this.onInit();
  }

  protected abstract onInit(): void;

  protected abstract startEvent(): void;

  abstract deployActionsAndEvents(): void;

  protected logEvent(eventName: string): void {
    console.log(
      `[${this.constructor.name}] Event executed '${eventName}' at ${new Date().toISOString()}`,
    );
  }

  protected checkEventSession(textWithSessionIncluded: string): boolean {
    const extractedSession = textWithSessionIncluded.split('|').pop()?.trim();
    return extractedSession === this.eventSession;
  }

  protected checkDelayedCommand(command: TelCommandValue): number {
    const now = new Date();
    if (!this.userConfig.restrictedCommands) return 0;
    const restrictedCommand = this.userConfig.restrictedCommands.find(
      (c) => c.command === `/${command}`,
    );
    if (!restrictedCommand || !restrictedCommand.cooldownSecs) return 0;
    const delayMs = restrictedCommand.cooldownSecs * 1000;
    if (!delayMs) return 0;

    for (const commandLastExecute of this.commandLastExecuteArr) {
      if (commandLastExecute && commandLastExecute.command !== command) continue;

      const timeElapsed = now.getTime() - commandLastExecute.time.getTime();
      if (timeElapsed < delayMs) {
        const timeLeftMs = delayMs - timeElapsed;
        const secondsLeft = Math.ceil(timeLeftMs / 1000);
        console.log(
          `[${this.constructor.name}] Command ${command} blocked by delay. Wait: ${secondsLeft}s`,
        );
        return secondsLeft;
      }

      commandLastExecute.time = now;
      return 0;
    }

    this.commandLastExecuteArr.push({ command: command, time: now });
    return 0;
  }
}
