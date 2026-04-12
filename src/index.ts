import configService from './services/config.service';
import translationService from './services/translation.service';
import { BotHandler } from './telbot-features/bot-handler';

const wolBotToken = process.env.TELEGRAM_BOT_TOKEN!;
if (!wolBotToken) throw new Error('Telegram bot token not in .env');
const wolBotHandler = new BotHandler(wolBotToken);

wolBotHandler.init();
configService.loadConfig();

translationService.init().then(() => {
  wolBotHandler.deployEvents();
  console.log('Application running');
});
