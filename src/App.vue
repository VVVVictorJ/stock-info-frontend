<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, TrendCharts, Fold, Expand, Search, Calendar, DataAnalysis, Timer, Document } from '@element-plus/icons-vue'

const route = useRoute()

// 从 localStorage 读取侧边栏折叠状态，默认为 false（展开）
const isCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

// 监听状态变化并保存到 localStorage
watch(isCollapsed, (newValue) => {
  localStorage.setItem('sidebar-collapsed', String(newValue))
})
</script>

<template>
  <div class="common-layout">
    <el-container class="layout-root">
      <el-header class="layout-header">
        <span class="title">Stock Info</span>
      </el-header>
      <el-container>
        <el-aside class="layout-aside" :width="isCollapsed ? '64px' : '200px'">
          <div class="aside-container">
            <el-menu
              :default-active="route.path"
              router
              :collapse="isCollapsed"
              :collapse-transition="false"
              class="menu-vertical"
            >
              <!-- 首页 -->
              <el-menu-item index="/">
                <el-icon><HomeFilled /></el-icon>
                <span>首页</span>
              </el-menu-item>

              <!-- 捕捉趋势（一级菜单，无跳转） -->
              <el-sub-menu index="catch-trend">
                <template #title>
                  <el-icon><TrendCharts /></el-icon>
                  <span>捕捉趋势</span>
                </template>
                <el-menu-item index="/catch-raise">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>五指标捕捉</span>
                </el-menu-item>
              </el-sub-menu>

              <!-- 查询数据（一级菜单，无跳转） -->
              <el-sub-menu index="query-data">
                <template #title>
                  <el-icon><Search /></el-icon>
                  <span>查询数据</span>
                </template>
                <el-menu-item index="/stock">
                  <el-icon><Document /></el-icon>
                  <span>单股查询</span>
                </el-menu-item>
              </el-sub-menu>

              <!-- 历史数据查询（一级菜单，无跳转） -->
              <el-sub-menu index="history-query">
                <template #title>
                  <el-icon><Calendar /></el-icon>
                  <span>历史数据查询</span>
                </template>
                <el-menu-item index="/trade-date-query">
                  <el-icon><Calendar /></el-icon>
                  <span>交易日查询</span>
                </el-menu-item>
                <el-menu-item index="/price-compare">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>价格对比</span>
                </el-menu-item>
              </el-sub-menu>

              <!-- 定时任务（一级菜单，有跳转） -->
              <el-menu-item index="/scheduler-manage">
                <el-icon><Timer /></el-icon>
                <span>定时任务</span>
              </el-menu-item>
            </el-menu>
            <div class="collapse-btn-container">
              <el-button
                class="collapse-btn"
                link
                :icon="isCollapsed ? Expand : Fold"
                @click="isCollapsed = !isCollapsed"
              />
            </div>
          </div>
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
  justify-content: center;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color);
  gap: 8px;
  flex-shrink: 0;
}
.layout-aside {
  padding: 0;
  border-right: 1px solid var(--el-border-color);
  overflow: hidden;
  transition: width 0.3s ease;
}
.aside-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}
.layout-main {
  background-color: var(--el-fill-color-blank);
  padding: 0;
  overflow: hidden;
  height: 100%;
}
.menu-vertical {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  overflow-x: hidden;
}
.menu-vertical .el-menu-item {
  min-width: 0;
}
.menu-vertical .el-sub-menu__title {
  min-width: 0;
}
.collapse-btn-container {
  padding: 12px;
  border-top: 1px solid var(--el-border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}
.collapse-btn {
  font-size: 18px;
}
.title {
  user-select: none;
}
</style>
