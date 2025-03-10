<template>
	<div class="w-full h-full">
		<Loading :loading></Loading>
	</div>
</template>
<script>
	import { nextTick } from 'vue';
	import Loading from '@/components/Loading.vue';
	export default {
		name: 'Carousel',
		props: ['loading', 'options', 'breaker'],
		data() {
			return {}
		},
		components: { Loading }
	}
</script>
<style scoped></style>