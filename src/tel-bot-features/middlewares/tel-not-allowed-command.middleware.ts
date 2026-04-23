import { Context } from 'telegraf';
import { deleteMessage, deleteMessageAfter } from '../../util/tel-messages.util';
import configService from '../../services/config.service';

/**
 * Acts as a bouncer for specific bot commands.
 */
export const telnotAllowedCommandMiddleware = () => {
  return async (ctx: Context, next: () => Promise<void>) => {
    if (!(ctx.message && 'text' in ctx.message)) {
      await next();
      return;
    }

    const text = ctx.message.text.split(' ');

    if (
      configService
        .getCommandsAllowedByTelUsername(ctx.from?.username)
        .find((c) => text.at(0) === `/${c}`)
    ) {
      ctx.state.isCommandMessage = true;
      await next();
      return;
    }

    const warningMessage = await ctx
      .reply(ctx.state.t('telegram_bot.error.invalid_command'))
      .catch((e) => {
        console.warn(
          `[NotCommandMessageMiddleware] ⚠️ Unexpected error writing the info message: ${e.description || 'Unknown reason'}`,
        );
      });

    if (warningMessage)
      deleteMessageAfter(
        5000,
        ctx,
        warningMessage.message_id,
        'NotCommandMessageMiddleware',
      );

    if (ctx.message && 'message_id' in ctx.message && !ctx.state.isCommandMessage) {
      await deleteMessage(ctx, ctx.message.message_id, 'CleanChatMiddleware');
    }
    return;
  };
};
