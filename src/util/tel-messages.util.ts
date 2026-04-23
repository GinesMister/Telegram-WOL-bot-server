import { Context } from 'telegraf';

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
