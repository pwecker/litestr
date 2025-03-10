<template><Loading :loading></Loading></template>
<script>
import axios from 'axios';
import Loading from '@/components/Loading.vue';
export default {
	name: 'Auth',
	components: { Loading },
	data() {
		return {
			loading: true,
			back_url: import.meta.env.VITE_BACK_URL || 'http://localhost:1337'
		}
	},
	mounted() {
		this._auth();
	},
	methods: {
		async _auth() {
			const query = window.location.search;
			const response = await axios.get(`${this.back_url}/api/auth/google/callback${query}`);
			const { jwt } = response.data;
			this.$cookies.set('jwt', jwt);
			window.opener.postMessage({ authenticated: true }, window.location.origin);
	  	window.addEventListener(
	      'message',
	      (event) => {
	      	if (event.origin === window.location.origin && event.data.action === 'close') {
	      		window.close();
	      	}
	      },
	      { once: true }
			);
		}
	}
}
</script>