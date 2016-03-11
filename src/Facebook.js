import fb from 'fbgraph';
import Promise from 'bluebird';
import request from 'request';

export default class Facebook {
	
	constructor(appId, appSecret) {
		this.appId = appId;
		this.appSecret = appSecret;
	}
	
	getFeed(userId) {
		return this.getAccessToken(this.appId, this.appSecret).then((token) => {
			return new Promise((resolve, reject) => {
				fb.setAccessToken(token);

				fb.get(userId + '/feed', (error, response) => {
					if (error) {
						reject(new Error(error));

						return;
					}

					resolve(response.data);
				});
			});
		});
	}

	getAccessToken(appId, appSecret) {
		return new Promise((resolve, reject) => {
			request.get(
				'https://graph.facebook.com/oauth/access_token?client_id='
					+ appId + '&client_secret='
					+ appSecret + '&grant_type=client_credentials',
				(error, response, body) => {
					if (error) {
						reject(new Error(error));

						return;
					}

					if (response.statusCode !== 200) {
						reject(new Error('Request failed (' + response.statusCode + ')'));

						return;
					}

					resolve(body.split('=')[1]);
				}
			);
		});
	}
	
}