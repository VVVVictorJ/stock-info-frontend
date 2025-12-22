<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="common-layout">
    <el-container class="layout-root">
      <el-header class="layout-header">Stock Info</el-header>
      <el-container>
        <el-aside class="layout-aside" width="200px">
          <el-menu
            :default-active="route.path"
            router
            class="menu-vertical"
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/catch-raise">涨跌捕捉</el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
  </template>

<!-- 全局样式，确保页面铺满可视区域 -->
<style>
html, body, #app {
  height: 100%;
  margin: 0;
}
</style>

<style scoped>
.layout-root {
  min-height: 100vh;
}
.layout-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color);
}
.layout-aside {
  padding: 0;
  border-right: 1px solid var(--el-border-color);
}
.layout-main {
  background-color: var(--el-fill-color-blank);
}
.menu-vertical {
  height: 100%;
  border-right: none;
}
</style>
