<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, TrendCharts, Fold, Expand, Search, Calendar, DataAnalysis, Timer, Document } from '@element-plus/icons-vue'

const route = useRoute()

// 从 localStorage 读取侧边栏折叠状态，默认为 false（展开）
const isCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

// 从 localStorage 读取子菜单展开状态
const getOpenedMenus = (): string[] => {
  const saved = localStorage.getItem('opened-submenus')
  let result = saved ? JSON.parse(saved) : []
  // 过滤掉无效的菜单项（只保留有效的子菜单）
  const validSubMenus = ['catch-trend', 'query-data', 'history-query']
  result = result.filter((item: string) => validSubMenus.includes(item))
  return result
}

const openedMenus = ref<string[]>(getOpenedMenus())
// 保存真实的展开状态（localStorage 的副本，不受 Element Plus 影响）
const savedOpenedMenus = ref<string[]>([...openedMenus.value])
// 菜单的 key，用于强制重新渲染
const menuKey = ref(0)

// 监听状态变化并保存到 localStorage
watch(isCollapsed, async (newValue, oldValue) => {
  localStorage.setItem('sidebar-collapsed', String(newValue))

  // 当侧边栏从折叠状态展开时，恢复之前保存的菜单展开状态
  if (oldValue === true && newValue === false) {
    // 先恢复数组
    openedMenus.value = [...savedOpenedMenus.value]

    // 然后强制重新渲染菜单
    await nextTick()
    menuKey.value++
  }
})

// 子菜单展开事件
const handleMenuOpen = (index: string) => {
  // 只处理 el-sub-menu（不处理 el-menu-item 如 "/"）
  const validSubMenus = ['catch-trend', 'query-data', 'history-query']
  if (!validSubMenus.includes(index)) {
    return
  }

  if (!openedMenus.value.includes(index)) {
    openedMenus.value.push(index)
  }
  if (!savedOpenedMenus.value.includes(index)) {
    savedOpenedMenus.value.push(index)
    localStorage.setItem('opened-submenus', JSON.stringify(savedOpenedMenus.value))
  }
}

// 子菜单关闭事件
const handleMenuClose = (index: string) => {
  // 只在侧边栏展开状态时处理关闭事件
  // 当侧边栏折叠时，忽略自动关闭事件
  if (isCollapsed.value) {
    return
  }

  const idx = openedMenus.value.indexOf(index)
  if (idx > -1) {
    openedMenus.value.splice(idx, 1)
  }

  const savedIdx = savedOpenedMenus.value.indexOf(index)
  if (savedIdx > -1) {
    savedOpenedMenus.value.splice(savedIdx, 1)
    localStorage.setItem('opened-submenus', JSON.stringify(savedOpenedMenus.value))
  }
}

</script>

<template>
  <el-aside class="layout-aside" :width="isCollapsed ? '64px' : '200px'">
    <div class="aside-container">
      <el-menu
        :key="menuKey"
        :default-active="route.path"
        :default-openeds="openedMenus"
        router
        :collapse="isCollapsed"
        :collapse-transition="false"
        class="menu-vertical"
        @open="handleMenuOpen"
        @close="handleMenuClose"
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
</template>

<style scoped>
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
</style>
