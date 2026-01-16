<script setup lang="ts">
import HeaderBar from './HeaderBar.vue'
import SideMenu from './SideMenu.vue'
import MainContent from './MainContent.vue'
</script>

<template>
  <div class="common-layout">
    <el-container class="layout-root" direction="vertical">
      <HeaderBar />
      <el-container class="body-container">
        <SideMenu />
        <MainContent />
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.common-layout {
  height: 100vh;
  overflow: hidden;
}
.layout-root {
  height: 100%;
  overflow: hidden;
}
.body-container {
  flex: 1;
  overflow: hidden;
}
</style>
