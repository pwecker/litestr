<template>
	<div class="w-full h-full flex flex-col p-3 bg-cyan-950">
		<CaptchaV2
		  v-if="captchav2 && !ux.verified"
		  :site_key="captchav2_site_key"
		  @verified="_validate"
		  @errored="_captchav2_errored"
		  @expired="_captchav2_expired"
		/>
		<div class="w-full h-auto flex justify-between">
			<div class="h-8 select-none rounded-lg bg-white px-3 text-sm leading-8 text-zinc-950">{{ user?.username || 'User...' }}</div>
			<a href="logout"><button class="cursor-pointer group h-8 select-none rounded-lg bg-white px-3 text-sm leading-8 text-zinc-950 shadow-[0_-1px_0_0px_#d4d4d8_inset,0_0_0_1px_#f4f4f5_inset,0_0.5px_0_1.5px_#fff_inset] hover:bg-zinc-50 hover:via-zinc-900 hover:to-zinc-800 active:shadow-[-1px_0px_1px_0px_#e4e4e7_inset,1px_0px_1px_0px_#e4e4e7_inset,0px_0.125rem_1px_0px_#d4d4d8_inset]"><span class="block group-active:[transform:translate3d(0,1px,0)]">Logout</span></button></a>
		</div>
		<div class="flex flex-1 justify-center items-center">
			<VDatePicker
        v-if="ranges.length > 0"
        v-model.range="range"
        :min-date='new Date()'
        :rows="calendar_rows"
        :columns="calendar_columns"
        :attributes="highlighted_dates"
        :disabled-dates="blocked_dates"
        :timezone="'UTC'"
      >
      	<template #footer>
					<div class="w-full flex justify-center align-start pb-3">
						<div class="p-3 w-full flex flex-col sm:flex-row gap-3 sm:gap-none items-center justify-around align-center">

							<div v-show="!range && !ux.Calendar.request_success" class="group h-8 px-3 text-sm leading-8 text-zinc-950">Select Dates to Request</div>

							<button @click="_click" v-show="range && !ux.verified && !ux.Calendar.clicked" class="cursor-pointer group h-8 select-none rounded-lg bg-white px-3 text-sm leading-8 text-zinc-950 shadow-[0_-1px_0_0px_#d4d4d8_inset,0_0_0_1px_#f4f4f5_inset,0_0.5px_0_1.5px_#fff_inset] hover:bg-zinc-50 hover:via-zinc-900 hover:to-zinc-800 active:shadow-[-1px_0px_1px_0px_#e4e4e7_inset,1px_0px_1px_0px_#e4e4e7_inset,0px_0.125rem_1px_0px_#d4d4d8_inset]"><span class="block group-active:[transform:translate3d(0,1px,0)]">{{request_text}}</span></button>

							<button @click="_clear" v-show="range && !ux.verified && !ux.Calendar.clicked" class="cursor-pointer group h-8 select-none rounded-lg bg-white px-3 text-sm leading-8 text-zinc-950 shadow-[0_-1px_0_0px_#d4d4d8_inset,0_0_0_1px_#f4f4f5_inset,0_0.5px_0_1.5px_#fff_inset] hover:bg-zinc-50 hover:via-zinc-900 hover:to-zinc-800 active:shadow-[-1px_0px_1px_0px_#e4e4e7_inset,1px_0px_1px_0px_#e4e4e7_inset,0px_0.125rem_1px_0px_#d4d4d8_inset]"><span class="block group-active:[transform:translate3d(0,1px,0)]">Clear Selection</span></button>

							<Loading v-if="ux.Calendar.clicked && !ux.Calendar.request_success" :loading></Loading>

							<span v-if="ux.Calendar.request_success && requested">{{requested_text}}</span>
						</div>
					</div>
	      </template>
      </VDatePicker>
		</div>
	</div>
</template>
<script>
	import axios from 'axios';
	import { useScreens } from 'vue-screen-utils';
	import CaptchaV2 from '@/components/CaptchaV2.vue';
	import { store } from '@/components/Store';
	import Loading from '@/components/Loading.vue';

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

	function textDate(dateStr) {
	  const [year, month, day] = dateStr.split('-').map(Number);
	  const monthNames = [
	    'Jan', 'Feb', 'March', 'Apr', 'May', 'June',
	    'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
	  ];
	  return `${monthNames[month - 1]} ${ordinalSuffix(day)}`;
	}
	function ordinalSuffix(day) {
	  if (day >= 11 && day <= 13) return `${day}th`;
	  switch (day % 10) {
	    case 1: return `${day}st`;
	    case 2: return `${day}nd`;
	    case 3: return `${day}rd`;
	    default: return `${day}th`;
	  }
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
			CaptchaV2,
			Loading
		},
		computed: {
			loading() {
				return !this.ux.Calendar.request_success;
			},
			requested_text() {
				if (!this.requested) return null;
				console.log()
				return `Requested: ${textDate(this.requested.in)} - ${textDate(this.requested.out)}`;
			},
			request_text() {
				if (!this.range) return 'Make Date Selection';
				return `Request: ${textDate(this.range.start.toISOString().split('T')[0])} - ${textDate(this.range.end.toISOString().split('T')[0])}`;
			},
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
			},
			calendar_rows() {
				const rowsRef = this.mapCurrent({
					xs: 2,
					sm: 1
				}, 1);
				return rowsRef.value;
			},
			calendar_columns() {
				const colsRef = this.mapCurrent({
					xs: 1,
					sm: 2
				}, 2);
				return colsRef.value;
			}
		},
		data() {
			return {
				ux: {
					verified: false,
					Calendar: {
						clicked: false,
						request_success: false
					}
				},
				ranges: [],
				attributes: [],
				range: null,
				requested: null,
				threshold: import.meta.env.VITE_RECAPTCHA_THRESHOLD || 0.5,
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
		setup() {
      const { mapCurrent } = useScreens({
	      xs: '0px',
	      sm: '640px',
	      md: '768px',
	      lg: '1024px',
	    });
	    return {
	      mapCurrent,
	    };
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
				if (!this.ux.verified) {

					const uxCalendar = { ...(store.model.ux.Calendar || {}) };
				  store.publish('ux.Calendar', { ...uxCalendar, clicked: true });

					await this.$recaptchaLoaded();
					const token = await this.$recaptcha('request_dates');
					this._validate(token, 'v3');
				}
			},
			_clear() {
				this.range = null;
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
						store.publish('ux.verified.deep', true);
						const uxCalendar = { ...(store.model.ux.Calendar || {}) };
						store.publish('ux.Calendar', { ...uxCalendar, request_success: true });
						this.requested = data.reservation;
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