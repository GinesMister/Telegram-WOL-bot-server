import { Context } from 'telegraf';
import { telCommandsArray } from '../../constants/tel-commands.const';
import { deleteMessageAfter } from '../../util/tel-messages.util';

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

    if (warningMessage)
      deleteMessageAfter(
        5000,
        ctx,
        warningMessage.message_id,
        'NotCommandMessageMiddleware',
      );
    return;
  };
};
