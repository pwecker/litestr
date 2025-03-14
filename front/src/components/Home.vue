<template>

	<div v-if="!ux.authenticated && ux.authenticated !== null" class="w-dvw h-dvh fixed flex flex-col z-[1] overflow-hidden pointer-events-none">
		<div class="flex-1"></div>
		<div class="p-6 sm:p-12">
			<div class="flex flex-col items-start gap-3 p-3">
				<div :key="feature.documentId" class="group h-8 select-none rounded-lg bg-white px-3 text-sm leading-8 text-zinc-950">{{feature.description}}</div>
				<div v-if="!ux.authenticated && ux.authenticated !== null" @click="_click" class="pointer-events-auto rounded-sm cursor-pointer">
					<button @click="_click" :style="{opacity: !ux.Home.clicked ? 1 : 0.5}" class="cursor-pointer group h-8 select-none rounded-lg bg-white px-3 text-sm leading-8 text-zinc-950 shadow-[0_-1px_0_0px_#d4d4d8_inset,0_0_0_1px_#f4f4f5_inset,0_0.5px_0_1.5px_#fff_inset] hover:bg-zinc-50 hover:via-zinc-900 hover:to-zinc-800 active:shadow-[-1px_0px_1px_0px_#e4e4e7_inset,1px_0px_1px_0px_#e4e4e7_inset,0px_0.125rem_1px_0px_#d4d4d8_inset]"><span class="block group-active:[transform:translate3d(0,1px,0)]">Check Availability</span></button>
				</div>
			</div>
		</div>
	</div>

	<div v-if="!ux.authenticated && ux.authenticated !== null" class="w-dvw h-dvh fixed top-0 z-[0] pointer-events-auto">
		<Loading :loading></Loading>
		<Carousel :options="{pageDots:false,wrapAround:true}">
			<div class="w-dvw h-dvh flex justify-center items-center" v-for="image in images">
				<div class="w-full h-full max-h-[95vh] max-w-[95vw] bg-contain bg-center bg-no-repeat" :style="{ backgroundImage: `url(${image})` }"></div>
			</div>
		</Carousel>
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
	import Loading from '@/components/Loading.vue';

	export default {
		name: 'Home',
		components: {
			Carousel,
			Calendar,
			Loading
		},
		computed: {
			images() {
				if (!this.ux.Home.images_loaded) return [];
				return this.contents.map(content => this.front_url + '/' + content.media);
			},
			loading() {
				return !this.ux.Home.images_loaded;
			}
		},
		data() {
			return {
				feature: {documentId: null, description: ''},
				contents: [],
				ux: {
					authenticated: null,
					Home: {
						clicked: false,
						images_loaded: false
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
			store.subscribe('ux.Carousel.selected_index', this._ux_Carousel_selected_index);
		},
		async created() {
			this._auth();
			try {
				const response = await axios.get(
					`${this.back_url}/api/contents`,
					{ headers: {
					  'Content-Type': 'application/json',
					}}
				);
				const { data } = response.data;
				this.contents = data;
				await this._preload_images();
				store.publish('ux.Home', { ...this.ux.Home, images_loaded: true });
			} catch(e) {}
		},
		methods: {
			_preload_images() {
				return Promise.all(
					this.contents.map(content =>
						new Promise(resolve => {
							const img = new Image();
							img.src = this.front_url + '/' + content.media;
							img.onload = resolve;
							img.onerror = resolve;
						})
					)
				);
			},
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
			_ux_Carousel_selected_index(model) {
				if (model !== undefined) {
					this.feature = this.contents[model];
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
          } else {}
				} catch (e) {
					store.publish('ux.authenticated.deep', false);
				}
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