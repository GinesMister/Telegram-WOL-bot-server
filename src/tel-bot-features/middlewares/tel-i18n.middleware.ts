import { TOptions } from 'i18next';
import translationService from '../../services/translation.service';
import { Context } from 'telegraf';

/**
 * Intercepts incoming messages to determine the user's
 * preferred language and injects a localized translation helper directly
 * into the Telegram Context.
 */
export const teli18nMiddleware = () => {
  return async (ctx: Context, next: () => Promise<void>) => {
    const userLangCode = ctx.from?.language_code || 'en';
    const baseLang = userLangCode.split('-')[0];

    ctx.state.lang = baseLang;

    ctx.state.t = (key: string, options?: TOptions) => {
      return translationService.tFixed(baseLang, key, options);
    };

    await next();
  };
};
