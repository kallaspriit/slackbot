import Promise from 'bluebird';
import BaseHandler from '../src/BaseHandler';
import Facebook from '../src/Facebook';
import moment from 'moment';
import http from 'http';
import cheerio from 'cheerio';
import htmlToText from 'html-to-text';

export default class LunchHandler extends BaseHandler {

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
		}, {
			name: 'Hot Pot',
			source: this.getHotPotMenu.bind(this)
		}, {
			name: 'Pahad poisid',
			source: this.getBadBoysMenu.bind(this)
		}, {
			name: 'Ülikooli kohvik',
			source: this.getTartuUniversityMenu.bind(this)
		}, {
			name: 'Vilde',
			source: this.getVildeMenu.bind(this)
		}];

		Promise.all(
			menuMap.map((item) => item.source())
		)
			.then((menus) => {
				menus.forEach((info, index) => {
					const menuInfo = menuMap[index];

					if (!info) {
						console.log('failed fetching menu #' + index);

						message.respond((index + 1) + '. *' + menuInfo.name + ':* _getting information failed_');

						return;
					}

					let response = '*' + menuInfo.name + ':* ' + info.items.join('; ');

					if (info.date instanceof Date) {
						response += ' (' + moment(info.date).fromNow() + ')';
					}

					message.respond(response);
				});
			})
			.catch((error) => {
				message.respond(error.stack.toString());
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

	getHotPotMenu() {
		return this.getDailySpecialOffers('#HOTPOT_FOOD', (html) => {
			const itemText = htmlToText.fromString(html);
			const lines = itemText.split('\n');

			if (lines.length > 2) {
				return lines.reduce((filteredLines, line, index) => {
					if ((index + 1) % 3 === 0) {
						filteredLines.push(line);
					}

					return filteredLines;
				}, []);
			}

			return [lines[0]];
		});
	}

	getBadBoysMenu() {
		return this.getDailySpecialOffers('#PAHADPOISID_FOOD', (html) => {
			const itemText = htmlToText.fromString(html, {
				wordwrap: 1000
			});
			const lines = itemText.split('\n');

			return lines.length > 2 ? lines.slice(0, -2) : [lines[0]];
		});
	}

	getTartuUniversityMenu() {
		return this.getDailySpecialOffers('#UT_FOOD', (html) => {
			const itemText = htmlToText.fromString(html, {
				wordwrap: 1000
			});
			const lines = itemText.split('\n');

			return lines.length > 1 ? lines.slice(0, -1) : [lines[0]];
		});
	}

	getVildeMenu() {
		return this.getDailySpecialOffers('#VILDE_FOOD', (html) => {
			const itemText = htmlToText.fromString(html, {
				wordwrap: 1000
			});
			const lines = itemText.split('\n');

			return lines;
		});
	}

	getDailySpecialOffers(name, htmlToItemsConverter) {
		const dailySpecialOptions = {
			host: 'www.paevapraed.com',
			port: 80,
			path: '/',
			method: 'POST'
		};

		return new Promise((resolve, reject) => {
			http.request(dailySpecialOptions, (res) => {
				let item = '';

				res.setEncoding('utf8');
				res.on('data', (chunk) => {
					const $ = cheerio.load(chunk);
					const chunkHtml = $(name).html();

					if (chunkHtml !== null) {
						item += chunkHtml;
					}
				});
				res.on('end', () => {
					const items = htmlToItemsConverter(item);

					resolve({
						items: items,
						date: null
					});
				});
				res.on('error', (err) => reject(err));
			}).end();
		});
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