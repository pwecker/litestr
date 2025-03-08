<template>
	<div class="w-full h-full flex flex-col p-6">
		<CaptchaV2
		  v-if="captchav2 && !verified"
		  :site_key="captchav2_site_key"
		  @verified="_validate"
		  @errored="_captchav2_errored"
		  @expired="_captchav2_expired"
		/>
		<div class="w-full h-[3em]">
			{{ user?.username || 'User...' }}
		</div>
		<div>
      <VDatePicker
        v-model.range="range"
        :min-date='new Date()'
        :columns="2"
      />
		</div>
		<div class="flex-1">
			<span v-if="range" @click="_click" class="cursor-pointer">Book Now</span>
		</div>
	</div>
</template>
<script>
	import axios from 'axios';
	import CaptchaV2 from '@/components/CaptchaV2.vue';
	
	export default {
		name: 'Calendar',
		props: {
			user: {
				type: Object,
			  default: null
			}
		},
		components: {
			CaptchaV2
		},
		data() {
			return {
				range: null,
				threshold: 0.5,
				verified: false,
				captchav2: false,
				back_url: import.meta.env.VITE_BACK_URL || 'http://localhost:1337',
				captchav2_site_key: import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY || '123'
			}
		},
		methods: {
			_book() {
				alert('Booked!')
			},
			async _click() {
				if (this.verified) {
					this._book();
				} else {
					await this.$recaptchaLoaded();
					const token = await this.$recaptcha('book_now');
					this._validate(token, 'v3');
				}
			},
			async _validate(token, version) {
				try {
					const jwt = this.$cookies.get('jwt');
					const response = await axios.post(
						`${this.back_url}/api/verify-captcha`,
						{ token, version, dates: this.range },
						{ headers: {
						  'Content-Type': 'application/json',
						  'Authorization': 'Bearer ' + jwt,
						}}
					);
					const { data } = response;
					if (data.success && (data.score === undefined || data.score >= this.threshold)) {
						this.verified = true;
						this._book();
					} else if (data.score && data.score < this.threshold) {
						this.captchav2 = true;
					}
				} catch(e) {

				}
			},
			_v2_expired() {},
			_v2_errored() {}
		}
	}
</script>
<style scoped></style>