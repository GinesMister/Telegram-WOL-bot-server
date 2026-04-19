import { Context } from 'telegraf';
import { deleteMessage } from '../../util/tel-messages.util';

export const telcleanChatMiddleware = () => {
  return async (ctx: Context, next: () => Promise<void>) => {
    await next();

    if (ctx.message && 'message_id' in ctx.message && !ctx.state.isCommandMessage) {
      await deleteMessage(ctx, ctx.message.message_id, 'CleanChatMiddleware');
    }
  };
};
