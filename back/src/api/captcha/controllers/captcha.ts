'use strict';

import { default as axios } from 'axios';

module.exports = {
	async verify(ctx) {
		const { token, version } = ctx.request.body;
		const key = version === 'v2' ?
		  process.env.RECAPTCHA_V2_SECRECT_KEY :
		  process.env.RECAPTCHA_SECRECT_KEY;

		const response = await axios({
      method: 'POST',
      url: 'https://www.google.com/recaptcha/api/siteverify',
      params: {
	      secret: key,
	      response: token
      },
      headers: {
			  'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
			}
    });

		const { data } = response;
		return ctx.send(data);
	}
};