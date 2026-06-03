import i18next, { TOptions } from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { DEFAULT_TRANSLATION_ROUTE_FOLDER, getAppDir } from '../constants/relative-routes.const';
import { parseToStringArray } from '../util/formatter.util';

/**
 * TranslationService wraps the i18next library to handle internationalization (i18n).
 * It dynamically loads translation files from the filesystem and provides safe methods
 * to retrieve localized strings.
 */
class TranslationService {
  private isInitialized: boolean = false;

  /**
   * Bootstraps the i18next engine. Must be called once during startup.
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const envLanguages = process.env.PRELOADED_LANGUAGES;
    const botLanguages = envLanguages ? parseToStringArray(envLanguages) : ['es', 'en'];

    await i18next.use(Backend).init({
      fallbackLng: 'en',
      lng: 'en',
      preload: botLanguages,
      backend: {
        loadPath: path.join(
          getAppDir(),
          process.env.TRANSLATION_ROUTE_FOLDER || DEFAULT_TRANSLATION_ROUTE_FOLDER,
          '/{{lng}}/{{ns}}.json',
        ),
      },
    });

    this.isInitialized = true;
    console.log('Translation service ready');
  }

  /**
   * Retrieves a translation using the globally set language.
   * @param key - The translation key (e.g., 'commands.wake.success')
   * @param options - Interpolation variables (e.g., { pcName: 'MyDesktop' })
   */
  t(key: string | string[], options?: TOptions): string {
    if (!this.isInitialized) {
      console.warn('Trying to translate before init');
      return Array.isArray(key) ? key[0] : key;
    }
    return i18next.t(key, options) as string;
  }

  /**
   * Retrieves a translation locked to a specific language.
   * Since multiple users might message the bot at the exact
   * same time in different languages, this method is useful to give message translated
   * for every user languages.
   * @param lang - The specific language code to use for this translation (e.g., 'es')
   * @param key - The translation key
   * @param options - Interpolation variables
   */
  tFixed(lang: string, key: string, options?: TOptions): string {
    if (!this.isInitialized) {
      console.warn('Trying to translate before init');
      return Array.isArray(key) ? key[0] : key;
    }
    const t = i18next.getFixedT(lang);
    return t(key, options);
  }

  async setLanguage(lng: string): Promise<void> {
    if (this.isInitialized) {
      await i18next.changeLanguage(lng);
    }
  }
}

// Export as a singleton
export default new TranslationService();
