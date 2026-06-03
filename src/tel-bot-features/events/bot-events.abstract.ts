import { Telegraf } from 'telegraf';
import { randomUUID } from 'node:crypto';
import { UserConfig } from '../../types/user-config.type';
import configService from '../../services/config.service';
import { TelCommandValue } from '../../constants/tel-commands.const';

// Defines a constructor signature for any class extending AbstractBotEvents.
export type BotEvent = new (bot: Telegraf) => AbstractBotEvents;

/**
 * AbstractBotEvents serves as the base blueprint for all bot command handlers.
 * It provides shared utilities so that child classes can focus
 * purely on the specific logic of their commands.
 */
export abstract class AbstractBotEvents {
  protected readonly bot: Telegraf;
  readonly eventSession: string;
  protected readonly userConfig: UserConfig;
  private commandLastExecuteArr: Array<{ command: TelCommandValue; time: Date }> = [];

  constructor(bot: Telegraf) {
    this.userConfig = configService.getConfig();
    this.bot = bot;
    // Generate a fresh UUID for this runtime session
    this.eventSession = randomUUID();
    this.setMyCommands();
    this.onInit();
  }

  // --- Contract Methods ---
  // Any child class extending this abstract class MUST implement these methods.

  protected abstract onInit(): void;

  protected abstract startEvent(): void;

  protected abstract setMyCommands(): void;

  abstract deployActionsAndEvents(): void;

  // --- Utilities methods ---

  /**
   * Standardized logging utility to keep console output clean and traceable.
   */
  protected logEvent(eventName: string): void {
    console.log(
      `[${this.constructor.name}] Event executed '${eventName}' at ${new Date().toISOString()}`,
    );
  }

  /**
   * Verifies current runtime session. If it doesn't match returns false.
   * @param textWithSessionIncluded - The callback data string (e.g., "wake_pc|123e4567-e89b...")
   */
  protected checkEventSession(textWithSessionIncluded: string): boolean {
    const extractedSession = textWithSessionIncluded.split('|').pop()?.trim();
    return extractedSession === this.eventSession;
  }

  /**
   * Enforces command cooldowns.
   * @param command - The command attempting to be executed (e.g., 'ping')
   * @returns The number of seconds remaining in the cooldown, or 0 if allowed to proceed.
   */
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
