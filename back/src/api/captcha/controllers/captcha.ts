'use strict';

import { default as axios } from 'axios';

module.exports = {
	async verify(ctx) {
		const user = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
		const { token, version, threshold, dates } = ctx.request.body;
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
		if (data.score > threshold) {

			//document service
			const reservation = await strapi.entityService.create('api::reservation.reservation', { data: {
					stat: 'requested',
					in: dates.start.split('T')[0],
					out: dates.end.split('T')[0],
					user: user.id
				},
			  populate: ['user']
			});

			return ctx.send({ success: true, reservation: reservation });
		} else {

			return ctx.send({ success: false })
		}
	}
};