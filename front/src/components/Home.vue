<template>
	<div class="w-dvw h-dvh flex flex-col overflow-hidden">
		<div class="flex-1"></div>
		<div class="p-6 sm:p-12">
			<div class="flex flex-col items-start gap-3">
				<div></div>
				<div class="mb-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
				<div class="p-3 rounded-sm">Check Availability</div>
			</div>
		</div>
	</div>
	<div class="w-dvw h-dvh fixed top-0 z-[-1]">
		<Carousel></Carousel>
	</div>
	<div class="w-dvw h-dvh fixed top-0 z-[1]">
		<Calendar></Calendar>
	</div>
</template>
<script>
	import Carousel from '@/components/Carousel.vue';
	import Calendar from '@/components/Calendar.vue';
	export default {
		name: 'Home',
		components: {
			Carousel,
			Calendar
		}
	}
</script>
<style scoped></style>