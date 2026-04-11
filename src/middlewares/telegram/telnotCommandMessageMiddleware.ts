import { Context } from 'telegraf';
import { telvalidCommands } from '../../constants/telvalidCommands.const';
import translationService from '../../services/translation.service';

export const telnotCommandMessageMiddleware = () => {

  return async (ctx: Context, next: () => Promise<void>) => {

    await next();
    if (!(ctx.message && 'text' in ctx.message)) {
      return;
    }

    const text = ctx.message.text.trim();

    if (telvalidCommands.find(c => text === c)) {
      return
    }

    const warningMessage = await ctx.reply(
      ctx.state.t('error.invalidCommand')
    ).catch(e => {
      console.warn(`[NotCommandMessageMiddleware] ⚠️ Unexpected error writing the info message: ${e.description || 'Unknown reason'}`)
    });

    setTimeout(async () => {
      if (warningMessage)
        await ctx.telegram.deleteMessage(ctx.chat!.id, warningMessage.message_id).catch((e) => {
            console.warn(`[NotCommandMessageMiddleware] ⚠️ Unable to delete info message: ${e.description || 'Unknown reason'}`);
        });
    }, 5000);

    return;
  };
};
