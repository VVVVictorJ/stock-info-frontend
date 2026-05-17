<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import LayoutContainer from './layout/LayoutContainer.vue'

const route = useRoute()
const useStandaloneLayout = computed(() => route.meta.standaloneLayout === true)
</script>

<template>
  <RouterView v-if="useStandaloneLayout" />
  <LayoutContainer v-else />
</template>

<!-- 全局样式，确保页面铺满可视区域 -->
<style>
html, body, #app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}
</style>

