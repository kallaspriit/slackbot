import SlackBot from 'slackbots';
import path from 'path';
import glob from 'glob';

/*
class Base {
	constructor(config) {
		console.log('Base constructor', config);
	}
}

export default class Child extends Base {

	constructor(config) {
		super(config);

		console.log('Child constructor', config);
	}

	static run(config) {
		const bot = new Child(config);

		bot.start();
	}

	start() {
		console.log('start..');
	}

}
*/

export default class Bot {

	constructor(config) {
		this.bot = new SlackBot(config);
		this.config = config;
		this.handlers = [];
	}

	static run(config) {
		const bot = new Bot(config);

		bot.start();
	}

	start() {
		this.handlers = this.loadHandlers();

		this.bot
			.on('open', this.onOpen.bind(this))
			.on('close', this.onClose.bind(this))
			.on('start', this.onStart.bind(this))
			.on('message', this.onMessage.bind(this));
	}

	onOpen() {
		console.log('opened');
	}

	onClose() {
		console.log('closed');
	}

	onStart() {
		console.log('started');

		this.getHelpHandler().instance.handle({
			text: 'help',
			respond: (response) => {
				this.bot.postMessageToGroup('test', response, {
					icon_url: this.config.picture // eslint-disable-line camelcase
				});
			}
		});
	}

	onMessage(info) {
		// console.log('message', info);

		info.respond = (text, options = {}) => {
			this.bot.postMessage(info.channel, text, {
				icon_url: this.config.picture,  // eslint-disable-line camelcase
				...options
			});
		};

		if (info.type === 'message' && info.username !== this.config.name) {
			this.handleMessage(info);
		}
	}

	handleMessage(message) {
		this.handlers.forEach((handler) => {
			try {
				if (handler.instance.match(message)) {
					handler.instance.handle(message);
				}
			} catch (e) {
				console.error(e);
			}
		});
	}

	loadHandlers() {
		const pattern = path.join(__dirname, '../handlers/*.js');

		return glob.sync(pattern).map((filename) => {
			const handlerClass = require(filename);
			const instance = new handlerClass.default(this); // eslint-disable-line

			return {
				filename: filename,
				handlerClass: handlerClass,
				instance
			};
		});
	}

	getHelpHandler() {
		return this.handlers.find((handler) => {
			return handler.filename.indexOf('HelpHandler') !== -1;
		});
	}

}
