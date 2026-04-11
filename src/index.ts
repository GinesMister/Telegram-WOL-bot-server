import { BotHandler } from './telbotFeatures/botHandler';

const botHandler = new BotHandler();
botHandler.init();
botHandler.deployEvents();

console.log('Application running');
