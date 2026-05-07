import { Context } from 'telegraf';
import authService from '../../services/auth.service';

/**
 * Acts as the absolute first line of defense for the bot.
 * It intercepts every single incoming message or action before it reaches
 * any command handlers.
 */
export const telauthMiddleware = () => {
  return async (ctx: Context, next: () => Promise<void>) => {
    const senderId = ctx.from?.id;
    const senderUsername = ctx.from?.username || ctx.from?.first_name || 'UNKNOWN';

    if (!senderId) {
      console.warn(
        '[AuthMiddleware] ⚠️ A Telegram update was received without remittent.',
      );
      return;
    }

    if (!authService.authByTeluser(senderId)) {
      console.warn(
        `[AuthMiddleware] 🚨 Attempt access blocked. ` +
          `User: @${senderUsername} (ID: ${senderId}) tried to execute a command.`,
      );
      return;
    }

    await next();
  };
};
