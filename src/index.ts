import dotenv from 'dotenv';
import configService from './services/config.service';
import translationService from './services/translation.service';
import { BotHandler } from './tel-bot-features/bot-handler';
import { BotWolEvents } from './tel-bot-features/events/impl/bot-wol-events';

dotenv.config();

configService.loadConfig();

translationService.init().then(() => {
  const wolBotToken = process.env.TELEGRAM_WOL_BOT_TOKEN!;
  if (!wolBotToken) throw new Error('TELEGRAM_WOL_BOT_TOKEN not in .env');
  const wolBotHandler = new BotHandler(wolBotToken, BotWolEvents);

  wolBotHandler.init();
  wolBotHandler.enableFeature();
  console.log('Application running');
});
