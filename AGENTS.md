# AGENTS.md

## Quick start
- `npm install` (npm, despite `packageManager` field)
- `npm run dev` – dev server with hot reload (tsx)
- `npm run build` – compile TS + copy `config.json5` & `locales/` to `dist/`
- `npm run start` – run compiled bot (`dist/src/index.js`)

## Bun executable
- `npm run build:bun` – compile to standalone executable (`dist/telegram-wol-bot`)
- `npm run start:bun` – run compiled executable
- External files (`config.json5`, `.env`, `locales/`) must be placed next to the executable
- Path resolution uses `getAppDir()` in `src/constants/relative-routes.const.ts`:
  - Bun runtime: `path.dirname(process.execPath)` (actual binary location)
  - Node/dev fallback: `path.resolve(__dirname, '..')`

## Commands
- Lint: `npm run lint` (ESLint with node `--permission` flags)
- Format: `npm run format` (Prettier)
- No test suite

## Architecture
- Entry: `src/index.ts` → loads config, translations, creates Telegraf bot
- Config: `config.json5` (JSON5) loaded by `src/services/config.service.ts`
- i18n: `locales/` directory, translation service initializes before bot starts
- Bot framework: Telegraf
- Build output: `dist/` (gitignored)
- Config path relative to index.js (`../config.json5`) can be overridden via `CONFIG_ROUTE_FILE` env
- `.env` loaded explicitly via `dotenv.config()` with path from `getAppDir()` (not side-effect import)

## Conventions
- TypeScript strict mode, ES2022, CommonJS modules
- Prettier: single quotes, trailing commas, 90 char width
- ESLint: typescript-eslint, unused vars prefixed with `_` allowed
- Config hot-reload via `/reload` command (no restart)
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` – nueva funcionalidad
  - `fix:` – corrección de bug
  - `chore:` – tareas de configuración o mantenimiento
  - Mensajes breves y descriptivos (en inglés)

## Environment
- Required env vars in `.env`: `TELEGRAM_WOL_BOT_TOKEN`, `ALLOWED_TELEGRAM_USERS_ID`
- Optional: `CONFIG_ROUTE_FILE`, `TRANSLATION_ROUTE_FOLDER`, `PRELOADED_LANGUAGES`
- `.env.template` provided
- `config.dev.json5` gitignored, used for local development

## Gotchas
- Edit `config.json5` and `locales/` before running `npm run build`
- `lint`/`format` use node `--permission` flags (ignore fs restrictions)
- No automated tests; verify manually via Telegram bot
- `packageManager` field says pnpm but npm works fine
- Config validation is strict: MAC format, IP format, unique `nameId`, etc.
- Bun executable bundles code but `.env`, `config.json5`, `locales/` are external files
