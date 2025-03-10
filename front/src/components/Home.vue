<template>
	<div class="w-dvw h-dvh flex flex-col overflow-hidden">
		<div class="flex-1"></div>
		<div class="p-6 sm:p-12">
			<div class="flex flex-col items-start gap-3">
				<div></div>
				<div class="mb-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
				<div v-if="!ux.authenticated" @click="_click" class="p-3 rounded-sm cursor-pointer">
					<span v-if="!ux.Home.clicked">Check Availability</span>
				</div>
			</div>
		</div>
	</div>
	<div class="w-dvw h-dvh fixed top-0 z-[-1]">
		<Carousel :loading></Carousel>
	</div>
	<div v-if="ux.authenticated" class="w-dvw h-dvh fixed top-0 z-[1]">
		<Calendar v-if="ux.authenticated" :user="user"></Calendar>
	</div>
</template>
<script>
	import axios from 'axios';
	import Carousel from '@/components/Carousel.vue';
	import Calendar from '@/components/Calendar.vue';
	import { store } from '@/components/Store';

	export default {
		name: 'Home',
		components: {
			Carousel,
			Calendar
		},
		computed: {
			loading() {
				return false;
			}
		},
		data() {
			return {
				ux: {
					Home: {
						clicked: false
					}
				},
				user: null,
				back_url: import.meta.env.VITE_BACK_URL || 'http://localhost:1337',
				front_url: import.meta.env.VITE_FRONT_URL || 'http://localhost:5173'
			}
		},
		beforeMount() {
			store.subscribe('ux', this._ux);
			store.publish('ux.Home', this.ux.Home);
			store.subscribe('ux.Home', this._ux_Home);
		},
		async created() {
			this._auth();
			try {
				const jwt = this.$cookies.get('jwt');
				const response = await axios.get(
					`${this.back_url}/api/reservations`,
					{ headers: {
					  'Content-Type': 'application/json',
					  'Authorization': 'Bearer ' + jwt,
					}}
				);
				const { data } = response;
				this.ranges = data;
			} catch(e) {}
		},
		methods: {
			_ux(model) {
				if (model) {
					this.ux = { ...this.ux, ...model };
				}
			},
			_ux_Home(model) {
				if (model) {
					this.ux.Home = { ...this.ux.Home, ...model };
				}
			},
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
          	store.publish('ux.authenticated.deep', true);
          }
				} catch (e) {}
			},
			async _click() {
				if (this.ux.authenticated) return;

				const uxHome = { ...(store.model.ux.Home || {}) };
				store.publish('ux.Home', { ...uxHome, clicked: true });

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
		}
	}
</script>
<style scoped></style>