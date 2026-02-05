<script setup lang="ts">
import HeaderBar from './HeaderBar.vue'
import SideMenu from './SideMenu.vue'
import MainContent from './MainContent.vue'
import WaveBackground from '@/component/WaveBackground.vue'
</script>

<template>
  <div class="common-layout">
    <!-- 全局 3D 波光粼粼背景 -->
    <WaveBackground
      color-a="#c93756"
      color-b="#ff6b8a"
      color-c="#6b1a2e"
      :wave-height="0.7"
      :wave-speed="0.3"
      :fps="60"
    />

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
  position: relative;
}
.layout-root {
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.body-container {
  flex: 1;
  overflow: hidden;
}
</style>
