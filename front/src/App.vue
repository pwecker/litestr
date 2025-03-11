<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { store } from '@/components/Store'
store.publish('ux', {});
</script>

<template>
  <RouterView />
</template>

<style>
  @import "tailwindcss";
  @import "@/assets/base.css";
</style>
