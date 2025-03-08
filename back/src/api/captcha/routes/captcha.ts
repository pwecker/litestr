module.exports = {
	routes: [
		{
			method: 'POST',
			path: '/verify-captcha',
			handler: 'captcha.verify',
			config: {
				auth: false,
				policies: []
			}
		}
	]
}