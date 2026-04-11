import i18next, { TOptions } from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

class TranslationService {
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await i18next
      .use(Backend)
      .init({
        fallbackLng: 'en',
        lng: 'es',
        backend: {
          loadPath: path.join(process.cwd(), 'locales/{{lng}}/{{ns}}.json')
        }
      });

    this.isInitialized = true;
    console.log('Translation service ready.');
  }

  t(key: string | string[], options?: TOptions): string {
    if (!this.isInitialized) {
      console.warn('Trying to translate before init');
      return Array.isArray(key) ? key[0] : key;
    }
    return i18next.t(key, options) as string; 
  }

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

export default new TranslationService();