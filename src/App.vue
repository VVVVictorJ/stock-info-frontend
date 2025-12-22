<script setup lang="ts"></script>

<template>
  <div class="common-layout">
    <el-container class="layout-root">
      <el-header class="layout-header">Header</el-header>
      <el-container>
        <el-aside class="layout-aside" width="200px">Aside</el-aside>
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
  border-right: 1px solid var(--el-border-color);
}
.layout-main {
  background-color: var(--el-fill-color-blank);
}
</style>
