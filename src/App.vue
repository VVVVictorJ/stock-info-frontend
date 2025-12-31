<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, TrendCharts, Fold, Expand, Search, Calendar, DataAnalysis } from '@element-plus/icons-vue'

const route = useRoute()
const isCollapsed = ref(false)
</script>

<template>
  <div class="common-layout">
    <el-container class="layout-root">
      <el-header class="layout-header">
        <el-button
          class="collapse-btn"
          link
          :icon="isCollapsed ? Expand : Fold"
          @click="isCollapsed = !isCollapsed"
        />
        <span class="title">Stock Info</span>
      </el-header>
      <el-container>
        <el-aside class="layout-aside" :width="isCollapsed ? '64px' : '200px'">
          <el-menu
            :default-active="route.path"
            router
            :collapse="isCollapsed"
            class="menu-vertical"
          >
            <el-menu-item index="/">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/catch-raise">
              <el-icon><TrendCharts /></el-icon>
              <span>涨跌捕捉</span>
            </el-menu-item>
            <el-menu-item index="/stock">
              <el-icon><Search /></el-icon>
              <span>单股查询</span>
            </el-menu-item>
            <el-menu-item index="/trade-date-query">
              <el-icon><Calendar /></el-icon>
              <span>交易日查询</span>
            </el-menu-item>
            <el-menu-item index="/price-compare">
              <el-icon><DataAnalysis /></el-icon>
              <span>价格对比</span>
            </el-menu-item>
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
  overflow: hidden;
}
</style>

<style scoped>
.common-layout {
  height: 100vh;
  overflow: hidden;
}
.layout-root {
  height: 100%;
  overflow: hidden;
}
.layout-root > .el-container {
  height: calc(100% - 60px);
  overflow: hidden;
}
.layout-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color);
  gap: 8px;
  flex-shrink: 0;
}
.layout-aside {
  padding: 0;
  border-right: 1px solid var(--el-border-color);
  overflow: hidden;
}
.layout-main {
  background-color: var(--el-fill-color-blank);
  padding: 0;
  overflow: hidden;
  height: 100%;
}
.menu-vertical {
  height: 100%;
  border-right: none;
}
.collapse-btn {
  margin-left: -4px;
}
.title {
  user-select: none;
}
</style>
