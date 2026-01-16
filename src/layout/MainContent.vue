<script setup lang="ts">
import AppFooter from './AppFooter.vue'
</script>

<template>
  <el-main class="layout-main">
    <div class="main-content">
      <router-view />
    </div>
    <AppFooter />
  </el-main>
</template>

<style scoped>
.layout-main {
  background-color: var(--el-fill-color-blank);
  padding: 0;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  overflow: auto;
}
</style>
