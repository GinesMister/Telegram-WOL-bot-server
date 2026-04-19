import { Context } from 'telegraf';
import { telCommandsArray } from '../../constants/tel-commands.const';

export const telnotCommandMessageMiddleware = () => {
  return async (ctx: Context, next: () => Promise<void>) => {
    if (!(ctx.message && 'text' in ctx.message)) {
      await next();
      return;
    }

    const text = ctx.message.text.split(' ');

    if (telCommandsArray.find((c) => text.at(0) === `/${c}`)) {
      ctx.state.isCommandMessage = true;
      await next();
      return;
    }

    await next();
    const warningMessage = await ctx
      .reply(ctx.state.t('telegram_bot.error.invalid_command'))
      .catch((e) => {
        console.warn(
          `[NotCommandMessageMiddleware] ⚠️ Unexpected error writing the info message: ${e.description || 'Unknown reason'}`,
        );
      });

    setTimeout(async () => {
      if (warningMessage)
        await ctx.telegram
          .deleteMessage(ctx.chat!.id, warningMessage.message_id)
          .catch((e) => {
            console.warn(
              `[NotCommandMessageMiddleware] ⚠️ Unable to delete info message: ${e.description || 'Unknown reason'}`,
            );
          });
    }, 5000);

    return;
  };
};
