export default class BaseHandler {

	constructor(bot) {
		this.bot = bot;
	}

	getDescription() {
		return '[Please override handler getDescription() method]';
	}

	getHelp() {
		return '_does not provide additional help information._';
	}

	match(message) {
		void message;

		return false;
	}

	handle(message) {
		void message;
	}

}