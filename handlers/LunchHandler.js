import Promise from 'bluebird';
import BaseHandler from '../src/BaseHandler';
import Facebook from '../src/Facebook';
import moment from 'moment';

export default class CalculatorHandler extends BaseHandler {

	getDescription() {
		return 'lunch: displays today\'s lunch menus';
	}

	getHelp() {
		return '*lunch* fetches menus for supported venues.';
	}

	match(message) {
		const regexpList = [
			/^lunch$/i,
			/mis .*lõunaks/i,
			/mis .*söögiks/i,
			/kuhu .*sööma/i,
			/kuhu .*lõunale/i,
			/nälg/i
		];

		return regexpList.find((regexp) => regexp.test(message.text)) ? true : false;
	}

	handle(message) {
		const menuMap = [{
			name: 'Püssirohukelder',
			source: this.getGunPowderCellarMenu.bind(this)
		}];

		Promise.any(
			menuMap.map((item) => item.source())
		)
			.then((...menus) => {
				const responseLines = [];

				menus.forEach((info, index) => {
					if (!info) {
						return;
					}

					const menuInfo = menuMap[index];

					responseLines.push(
						(index + 1) + '. *' + menuInfo.name + ':* ' + info.items.join(', ')
						+ ' (' + moment(info.date).fromNow() + ')'
					);
				});

				message.respond(responseLines.join('\n'));
			})
			.catch((error) => {
				message.respond(error.message);
			});
	}
	
	getGunPowderCellarMenu() {
		const facebook = new Facebook(
			this.bot.config.facebook.id,
			this.bot.config.facebook.secret
		);

		return facebook.getFeed('pyssirohukelder').then((data) => {
			const menuItemRegexp = /^(\*)(.*)$/;
			const menuPost = data.find((post) => {
				const lines = post.message.split('\n');

				return lines.find((line) => {
					return menuItemRegexp.test(line);
				});
			}) || null;

			if (!menuPost) {
				return null;
			}

			const items = menuPost.message.split('\n').reduce((list, line) => {
				const matches = menuItemRegexp.exec(line);

				if (!matches) {
					return list;
				}

				list.push(matches[2]);

				return list;
			}, []);
			
			return {
				items: items,
				date: new Date(menuPost.created_time),
				post: menuPost
			};
		});
	}
}