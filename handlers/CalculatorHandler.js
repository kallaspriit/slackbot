import BaseHandler from '../src/BaseHandler';

export default class CalculatorHandler extends BaseHandler {

	getDescription() {
		return 'calculator: can evaluate mathematical expressions such as "(1+5)/2"';
	}

	getHelp() {
		return '*calculator* uses javascript eval() to evaluate numeric match expressions.';
	}

	match(message) {
		const mathExpressionRegex = /^[0-9\+\-\*\/\^\(\)\.]{3,}$/;

		// validate that only constains math expressions characters
		if (!mathExpressionRegex.test(message.text)) {
			return false;
		}

		try {
			eval(message.text); // eslint-disable-line no-eval

			return true;
		} catch (e) {
			return false;
		}
	}

	handle(message) {
		try {
			const result = eval(message.text); // eslint-disable-line no-eval

			// don't respond if calculated response is the same as input
			if (message.text === result.toString || typeof result !== 'number' || Number.isNaN(result)) {
				return;
			}

			message.respond(message.text + '=*' + result + '*');
		} catch (e) {
			// ignore
		}
	}

}