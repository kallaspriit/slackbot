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
			/mis .*sööme/i,
			/mida .*sööme/i,
			/kuhu .*sööma/i,
			/kuhu .*lõunale/i,
			/lähme .*sööma/i,
			/lähme .*lõunale/i,
			/sööma\?/i,
			/lõunale\?/i,
			/nälg/i
		];

		return regexpList.find((regexp) => regexp.test(message.text)) ? true : false;
	}

	handle(message) {
		const menuMap = [{
			name: 'Püssirohukelder',
			source: this.getGunPowderCellarMenu.bind(this)
		}, {
			name: 'Sheriff',
			source: this.getSheriffMenu.bind(this)
		}];

		Promise.all(
			menuMap.map((item) => item.source())
		)
			.then((menus) => {
				const responseLines = [];

				menus.forEach((info, index) => {
					const menuInfo = menuMap[index];

					if (!info) {
						console.log('failed fetching menu #' + index);

						responseLines.push(
							(index + 1) + '. *' + menuInfo.name + ':* _getting information failed_'
						);

						return;
					}

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
		const menuItemRegexp = /^(\*)(.*)$/;

		return this.getFacebookMenu(
			'pyssirohukelder',
			(post) => {
				const lines = post.message.split('\n');

				return lines.find((line) => {
					return menuItemRegexp.test(line);
				});
			},
			(post) => {
				return post.message
					.split('\n')
					.reduce((list, line) => {
						const matches = menuItemRegexp.exec(line);

						if (!matches) {
							return list;
						}

						list.push(matches[2]);

						return list;
					}, []);
			}
		);
	}

	getSheriffMenu() {
		return this.getFacebookMenu(
			'751390341596578',
			(post) => {
				const lines = post.message.split('\n');

				return lines.find((line) => {
					return (/päevapakkumised/i).test(line);
				});
			},
			(post) => {
				return post.message
					.split('\n')
					.reduce((list, line, index) => {
						if (index > 0) {
							list.push(line);
						}

						return list;
					}, []);
			}
		);
	}

	getFacebookMenu(userId, postMatcherFn, menuExtracterFn) {
		const facebook = new Facebook(
			this.bot.config.facebook.id,
			this.bot.config.facebook.secret
		);

		return facebook.getFeed(userId)
			.then((data) => {
				const post = data.find(postMatcherFn) || null;

				if (!post) {
					return null;
				}

				const items = menuExtracterFn(post);
				const date = new Date(post.created_time);

				return {
					items,
					date,
					post
				};
			})
			.catch((error) => {
				console.error('fetching menu for "' + userId + '" failed: ' + error.message);
			});
	}
}