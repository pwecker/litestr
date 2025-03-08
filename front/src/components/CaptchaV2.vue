<template>
  <div ref="captcha"></div>
</template>
<script>
export default {
	name: 'CaptchaV2',
	props: {
		site_key: {
			type: String,
			required: true
		}
	},
	data() {
	  return {
	  	widget_id: null
	  }
	},
	beforeMount() {
		this._load();
	},
	mounted() {
		this._render();
	},
	methods: {
		_load() {
			if (window.grecaptcha) return;

			return new Promise((resolve, reject) => {
				const script = document.createElement('SCRIPT');
				script.src = 'https://www.google.com/recaptcha/api.js';
				script.async = true;
				script.defer = true;

				script.onload = () => resolve();
				script.onerror = reject;

				document.head.appendChild(script);
			});
		},
		_render() {
			if (!window.grecaptcha || !this.$refs.captcha) {
				setTimeout(this._render, 100);
				return;
			}

			this.widget_id = window.grecaptcha.render(this.$refs.captcha, {
				sitekey: this.site_key,
				callback: this._verified,
				'expired-callback': this._expired,
				'error-callback': this._errored
			})
		},
		_verified(token) {
			this.$emit('verified', token, 'v2');
		},
		_expired() {
			this.$emit('expired');
		},
		_errored() {
			this.$emit('errored');
		}
	}
}
</script>