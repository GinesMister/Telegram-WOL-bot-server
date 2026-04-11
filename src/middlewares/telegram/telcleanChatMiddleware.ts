import { Context } from 'telegraf';

export const telcleanChatMiddleware = () => {
  return async (ctx: Context, next: () => Promise<void>) => {
    await next();

    if (ctx.message && 'message_id' in ctx.message) {
        await ctx.deleteMessage(ctx.message.message_id).catch((e) => 
            console.warn(
              `[CleanChatMiddleware] ⚠️ Unable to delete message (ID: ${ctx.message!.message_id}):
              ${e.description || 'Unknown reason'}`));
    }
  };
};