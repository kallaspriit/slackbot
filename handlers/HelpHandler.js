import BaseHandler from '../src/BaseHandler';

export default class HelpHandler extends BaseHandler {

	static regexp = /^help( (\w+))?$/i;

	getDescription() {
		return 'help: prints commands help information';
	}

	match(message) {
		return HelpHandler.regexp.test(message.text);
	}

	handle(message) {
		const matches = HelpHandler.regexp.exec(message.text);
		const commandName = matches[2];
		const isSpecificCommand = commandName ? true : false;

		if (isSpecificCommand) {
			this.handleCommandHelp(message, commandName);
		} else {
			this.handleGeneralHelp(message);
		}
	}

	handleCommandHelp(message, commandName) {
		const handlerNumber = Number.parseInt(commandName, 10);
		let handler = null;

		if (Number.isNaN(handlerNumber)) {
			handler = this.bot.handlers.find((handlerInfo) => {
				const name1 = handlerInfo.instance.getDescription().substr(0, commandName.length).toLowerCase();
				const name2 = commandName.toLowerCase();

				console.log('compare', name1, name2);

				return name1 === name2;
			}) || null;
		} else {
			const handlerIndex = handlerNumber - 1;

			handler = this.bot.handlers[handlerIndex] || null;
		}

		if (!handler) {
			message.respond('command "' + commandName + '" not found');

			return;
		}

		message.respond(handler.instance.getHelp());
	}

	handleGeneralHelp(message) {
		let response = '*Supported handlers*';

		this.bot.handlers.forEach((handler, index) => {
			response += '\n' + (index + 1) + '. ' + handler.instance.getDescription();
		});

		response += '\n\nYou can type *help calc* etc to get extra help for given command '
			+ '(must match beginning of command)';

		message.respond(response);
	}

}