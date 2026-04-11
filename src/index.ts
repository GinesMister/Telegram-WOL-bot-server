import translationService from './services/translation.service';
import { BotHandler } from './telbotFeatures/botHandler';

const botHandler = new BotHandler();

botHandler.init();

translationService.init().then(() => {
    botHandler.deployEvents();
    console.log('Application running');
});
