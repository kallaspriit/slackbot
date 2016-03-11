import SlackBot from 'slackbots';
import glob from 'glob';

export default class Bot extends SlackBot {

	constructor(config) {
		super(config);

		this.config = config;
		this.handlers = [];
	}

	start() {
		this.handlers = this.loadHandlers();

		console.log('handlers', this.handlers);

		this
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

		this.postMessageToGroup('test', 'hey!', {
			icon_url: this.config.picture // eslint-disable-line camelcase
		});
	}

	onMessage(info) {
		console.log('message', info);

		info.respond = (text, options = {}) => {
			this.postMessage(info.channel, text, {
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
			if (handler.instance.match(message)) {
				handler.instance.handle(message);
			}
		});
	}

	loadHandlers() {
		const path = __dirname + '/../handlers/*.js';

		return glob.sync(path).map((filename) => {
			const handlerClass = require(filename);
			const instance = new handlerClass.default(this); // eslint-disable-line;

			return {
				filename: filename,
				handlerClass: handlerClass,
				instance
			};
		});
	}

}