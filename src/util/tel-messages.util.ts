import { Context } from 'telegraf';
import { TelCommandValue } from '../constants/tel-commands.const';

export const deleteMessageAfter = async (
  ms: number,
  ctx: Context,
  messageId: number,
  fromScope: string | undefined,
): Promise<void> => {
  if (!messageId) return;
  setTimeout(() => {
    deleteMessage(ctx, messageId, fromScope);
  }, ms);
};

export const deleteMessage = async (
  ctx: Context,
  messageId: number,
  fromScope: string | undefined,
) => {
  ctx.telegram.deleteMessage(ctx.chat!.id, messageId).catch((e) =>
    console.warn(
      `${fromScope ? '[' + fromScope + ']' : ''} ⚠️ Unable to delete message (ID: ${messageId}):
                ${e.description || 'Unknown reason'}`,
    ),
  );
};

export const replyDelayedCommand = (
  command: TelCommandValue,
  cooldownSecs: number,
  ctx: Context,
) => {
  if (cooldownSecs > 0) {
    ctx
      .reply(
        ctx.state.t('telegram_bot.global.command_on_cooldown', {
          command: command,
          secs: cooldownSecs,
        }),
      )
      .then((r) =>
        deleteMessageAfter(cooldownSecs * 1000, ctx, r.message_id, 'BotWolEvents'),
      )
      .then(() => deleteMessage(ctx, ctx.message!.message_id, 'BotWolEvents'));
    return;
  }
};

export const answerCtx = async (
  ctx: Context,
  message: string,
  typeAnswer: 'answerCbQuery' | 'reply',
  cbQueryExtraData = {},
) => {
  if (typeAnswer === 'answerCbQuery') await ctx.answerCbQuery(message, cbQueryExtraData);
  if (typeAnswer === 'reply') await ctx.reply(message);
};
