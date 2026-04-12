import { Context } from 'telegraf';
import { authService } from '../../services/auth.service';

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
      console.error(
        `[AuthMiddleware] 🚨 Attempt access blocked. ` +
          `User: @${senderUsername} (ID: ${senderId}) tried to execute a command.`,
      );
      return;
    }

    await next();
  };
};
