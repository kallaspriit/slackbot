import Bot from './src/Bot';
import config from './config';

// create the bot
const bot = new Bot(config);

// run it
bot.start();