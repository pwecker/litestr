export default ({ env }) => ({
	email: {
		config: {
			provider: 'nodemailer',
			providerOptions: {
				host: env('SMTP_HOST'),
				port: env('SMTP_PORT'),
				auth: {
					user: env('SMTP_USER'),
					pass: env('SMTP_PASSWORD')
				}
			},
			settings: {
				defaultFrom: env('MANAGER_EMAIL'),
				defaultReplyTo: env('MANAGER_EMAIL')
			}
		}
	}
});
