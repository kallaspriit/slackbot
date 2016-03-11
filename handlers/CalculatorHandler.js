import BaseHandler from '../src/BaseHandler';

export default class CalculatorHandler extends BaseHandler {

	getDescription() {
		return 'calculator: can evaluate mathematical expressions such as "(1+5)/2"';
	}

	getHelp() {
		return '*calculator* uses javascript eval() to evaluate numeric match expressions.';
	}

	match(message) {
		const matchExpressionRegex = /^[0-9\+\-\*\/\^\(\)\.]{3,}$/;
		const allNumbersRegex = /^[0-9]+$/;

		// validate that only constains match expressions characters but is not all just numbers
		if (!matchExpressionRegex.test(message.text) || allNumbersRegex.test(message.text)) {
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

			if (typeof result === 'number') {
				message.respond(message.text + '=*' + result + '*');
			} else {
				message.respond(result);
			}
		} catch (e) {
			// ignore
		}
	}

}