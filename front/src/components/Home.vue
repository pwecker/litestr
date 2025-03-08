<template>
	<div class="w-dvw h-dvh flex flex-col overflow-hidden">
		<div class="flex-1"></div>
		<div class="p-6 sm:p-12">
			<div class="flex flex-col items-start gap-3">
				<div></div>
				<div class="mb-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
				<div @click="_click" class="p-3 rounded-sm cursor-pointer">Check Availability</div>
			</div>
		</div>
	</div>
	<div class="w-dvw h-dvh fixed top-0 z-[-1]">
		<Carousel></Carousel>
	</div>
	<div v-if="authenticated" class="w-dvw h-dvh fixed top-0 z-[1]">
		<Calendar v-if="authenticated" :user="user"></Calendar>
	</div>
</template>
<script>
	import axios from 'axios';
	import Carousel from '@/components/Carousel.vue';
	import Calendar from '@/components/Calendar.vue';

	export default {
		name: 'Home',
		components: {
			Carousel,
			Calendar
		},
		data() {
			return {
				user: null,
				authenticated: false,
				back_url: import.meta.env.VITE_BACK_URL || 'http://localhost:1337',
				front_url: import.meta.env.VITE_FRONT_URL || 'http://localhost:5173'
			}
		},
		methods: {
			async _auth() {
				try {
					const jwt = this.$cookies.get('jwt');
					const response = await axios.get(`${this.back_url}/api/users/me`, {
						headers: {
              Authorization: 'Bearer ' + jwt
            }
          });
          if (response.status === 200) {
          	this.user = response.data;
          	this.authenticated = true;
          }
				} catch (e) {}
			},
			async _click() {
				if (this.authenticated) return;
				const authUrl = `${this.back_url}/api/connect/google`;
				const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
				if (!popup) {
					return;
				}

				window.addEventListener(
					'message',
					async (event) => {
						if (event.origin === this.front_url && event.data.authenticated) {
							popup.postMessage({ action: 'close' }, this.front_url);
							await this._auth();
						}
					},
					{ once: true }
				)
			}
		},
		mounted() {
			this._auth();
		}
	}
</script>
<style scoped></style>