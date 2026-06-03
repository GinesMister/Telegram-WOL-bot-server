import path from 'path';

/**
 * Returns the base directory for resolving external file paths (.env, config.json5, locales/).
 *
 * - In a Bun compiled binary: process.execPath is the actual binary,
 *   so dirname gives us the directory where the executable lives.
 * - In Node/dev mode: __dirname is src/constants/,
 *   so one level up gives us src/ (config path uses ../ to reach project root).
 */
export function getAppDir(): string {
  if (typeof Bun !== 'undefined') {
    return path.dirname(path.resolve(process.execPath));
  }
  return path.resolve(__dirname, '..');
}

export const DEFAULT_TRANSLATION_ROUTE_FOLDER = '../locales' as const;
export const DEFAULT_CONFIG_ROUTE_FILE = '../config.json5' as const;
