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
        v-if="attributes.length > 0"
        v-model.range="range"
        :min-date='new Date()'
        :columns="2"
        :attributes="attributes"
        :disabled-dates="blocked_dates"
        :timezone="'UTC'"
      />
		</div>
		<div class="flex-1">
			<span v-if="range && !verified" @click="_click" class="cursor-pointer">Book Now</span>
		</div>
	</div>
</template>
<script>
	import axios from 'axios';
	import CaptchaV2 from '@/components/CaptchaV2.vue';

	const colors = {
		confirmed: 'gray',
		owned: 'green',
		requested: 'yellow'
	};

	const fillModes = {
		confirmed: 'solid',
		owned: 'solid',
		requested: 'solid'
	}
	
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
		computed: {
			blocked_dates() {
				return this.attributes.map(item => {
					return item.dates.map(range => ({
						start: this._shift_day(range[0], 1),
						end: this._shift_day(range[1], -1)
					}));
				}).flat();
			}
		},
		data() {
			return {
				attributes: [],
				range: null,
				threshold: import.meta.env.VITE_RECAPTCHA_THRESHOLD || 0.5,
				verified: false,
				captchav2: false,
				back_url: import.meta.env.VITE_BACK_URL || 'http://localhost:1337',
				captchav2_site_key: import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY || '123'
			}
		},
		async created() {
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

				const attributes = data.map((item) => {
					const stat = item.stat === 'confirmed' && item.own ? 'owned' : item.stat;
					return {
						highlight: {
							color: colors[stat],
						  fillMode: fillModes[stat],
						},
						dates: [[item.in, item.out]]
					}
				});

				this.attributes = attributes;
			} catch(e) {}
		},
		methods: {
			_shift_day(dateStr, shift) {
				const date = this._parse_utc(dateStr);
				date.setUTCDate(date.getUTCDate() + shift);
				return this._format_utc(date);
			},
			_parse_utc(dateStr) {
				const [year, month, day] = dateStr.split('-').map(Number);
				return new Date(Date.UTC(year, month - 1, day));
			},
			_format_utc(date) {
				return date.toISOString().split('T')[0];
			},
			async _click() {
				if (!this.verified) {
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
						{ token, version, threshold: this.threshold, dates: this.range },
						{ headers: {
						  'Content-Type': 'application/json',
						  'Authorization': 'Bearer ' + jwt,
						}}
					);
					const { data } = response;
					if (data.success && (data.score === undefined || data.score >= this.threshold)) {
						this.verified = true;
					} else if (data.score && data.score < this.threshold) {
						this.captchav2 = true;
					}
				} catch(e) {

				}
			},
			_captchav2_expired() {},
			_captchav2_errored() {}
		}
	}
</script>
<style scoped></style>