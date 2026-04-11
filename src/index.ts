import { BotHandler } from './telbotFeatures/botHandler';

const botHandler = new BotHandler();
botHandler.launch();
botHandler.deployEvents();

console.log('Application running');
