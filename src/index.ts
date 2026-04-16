import 'dotenv/config';
import configService from './services/config.service';
import translationService from './services/translation.service';
import { BotHandler } from './tel-bot-features/bot-handler';
import { BotWolEvents } from './tel-bot-features/events/impl/bot-wol-events';

const wolBotToken = process.env.TELEGRAM_WOL_BOT_TOKEN!;
if (!wolBotToken) throw new Error('TELEGRAM_WOL_BOT_TOKEN not in .env');
const wolBotHandler = new BotHandler(wolBotToken, BotWolEvents);

configService.loadConfig();

translationService.init().then(() => {
  wolBotHandler.init();
  wolBotHandler.deployEvents();
  console.log('Application running');
});
