<template>
	<div class="w-full h-full flex flex-col p-6">
		<div class="w-full h-[3em]">
			{{ user?.username || 'User...' }}
		</div>
		<div class="flex-1"></div>
	</div>
</template>
<script>
	export default {
		name: 'Calendar',
		props: {
			user: {
				type: Object,
			  default: null
			}
		}
	}
</script>
<style scoped></style>