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
        v-if="ranges.length > 0"
        v-model.range="range"
        :min-date='new Date()'
        :columns="2"
        :attributes="highlighted_dates"
        :disabled-dates="blocked_dates"
        :timezone="'UTC'"
      />
		</div>
		<div class="flex-1">
			<span v-if="range && !verified" @click="_click" class="cursor-pointer">
				<span v-if="!ux.Calendar.clicked">Request These Dates</span>
			</span>
		</div>
	</div>
</template>
<script>
	import axios from 'axios';
	import CaptchaV2 from '@/components/CaptchaV2.vue';
	import { store } from '@/components/Store';

	const colors = {
		confirmed: 'gray',
		denied: 'gray',
		owned: 'green',
		requested: 'yellow'
	};

	const fillModes = {
		confirmed: 'solid',
		denied: 'solid',
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
				return this.ranges.map(item => {
					return {
						start: this._shift_day(item.in, 1),
						end: this._shift_day(item.out, -1)
					};
				}).flat();
			},
			highlighted_dates() {
				return this.ranges.map((item) => {
					const stat = item.stat === 'confirmed' && item.own ? 'owned' : item.stat;
					return {
						highlight: {
							color: colors[stat],
						  fillMode: fillModes[stat],
						},
						dates: [[item.in, item.out]]
					}
				});
			}
		},
		data() {
			return {
				ux: {
					Calendar: {
						clicked: false
					}
				},
				ranges: [],
				attributes: [],
				range: null,
				threshold: import.meta.env.VITE_RECAPTCHA_THRESHOLD || 0.5,
				verified: false,
				captchav2: false,
				back_url: import.meta.env.VITE_BACK_URL || 'http://localhost:1337',
				captchav2_site_key: import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY || '123'
			}
		},
		beforeMount() {
			store.subscribe('ux', this._ux);
			store.publish('ux.Calendar', this.ux.Calendar);
			store.subscribe('ux.Calendar', this._ux_Calendar);
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
				this.ranges = data;
			} catch(e) {}
		},
		methods: {
			_ux(model) {
				if (model) {
					this.ux = { ...this.ux, ...model };
				}
			},
			_ux_Calendar(model) {
				if (model) {
					this.ux.Calendar = { ...this.ux.Calendar, ...model };
				}
			},
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
					const token = await this.$recaptcha('request_dates');
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
					if (data.success) {
						this.verified = true;
						this.range = null;
						this.ranges.push(data.reservation);
					} else {
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