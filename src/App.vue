<script setup lang="ts">
import LayoutContainer from './layout/LayoutContainer.vue'
</script>

<template>
  <LayoutContainer />
</template>

<!-- 全局样式，确保页面铺满可视区域 -->
<style>
html, body, #app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}
</style>

