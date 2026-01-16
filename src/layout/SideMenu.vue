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
        <template v-for="item in menuConfig" :key="item.index">
          <!-- 有子菜单：渲染 el-sub-menu -->
          <el-sub-menu v-if="item.children" :index="item.index">
            <template #title>
              <el-icon><component :is="iconMap[item.icon]" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.index"
              :index="child.index"
            >
              <el-icon><component :is="iconMap[child.icon]" /></el-icon>
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <!-- 无子菜单：渲染 el-menu-item -->
          <el-menu-item v-else :index="item.index">
            <el-icon><component :is="iconMap[item.icon]" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </template>
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

<script setup lang="ts">
import { ref, watch, nextTick, computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  TrendCharts,
  Fold,
  Expand,
  Search,
  Calendar,
  DataAnalysis,
  Timer,
  Document
} from '@element-plus/icons-vue'

// ==================== 图标映射配置 ====================
const iconMap: Record<string, Component> = {
  home: HomeFilled,
  trend: TrendCharts,
  search: Search,
  calendar: Calendar,
  dataAnalysis: DataAnalysis,
  timer: Timer,
  document: Document,
}

// ==================== 菜单项类型定义 ====================
interface MenuItem {
  index: string       // 路由路径或子菜单标识
  title: string       // 显示名称
  icon: string        // iconMap 中的 key
  children?: MenuItem[] // 子菜单项（可选）
}

// ==================== 菜单配置 ====================
const menuConfig: MenuItem[] = [
  // 首页
  { index: '/', title: '首页', icon: 'home' },
  // 捕捉趋势
  {
    index: 'catch-trend',
    title: '捕捉趋势',
    icon: 'trend',
    children: [
      { index: '/catch-raise', title: '五指标捕捉', icon: 'dataAnalysis' }
    ]
  },
  // 查询数据
  {
    index: 'query-data',
    title: '查询数据',
    icon: 'search',
    children: [
      { index: '/stock', title: '单股查询', icon: 'document' }
    ]
  },
  // 历史数据查询
  {
    index: 'history-query',
    title: '历史数据查询',
    icon: 'calendar',
    children: [
      { index: '/trade-date-query', title: '交易日查询', icon: 'calendar' },
      { index: '/price-compare', title: '价格对比', icon: 'dataAnalysis' }
    ]
  },
  // 定时任务
  { index: '/scheduler-manage', title: '定时任务', icon: 'timer' }
]

// ==================== 自动计算有效子菜单列表 ====================
const validSubMenus = computed(() =>
  menuConfig.filter(item => item.children).map(item => item.index)
)

const route = useRoute()

// 从 localStorage 读取侧边栏折叠状态，默认为 false（展开）
const isCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

// 从 localStorage 读取子菜单展开状态
const getOpenedMenus = (): string[] => {
  const saved = localStorage.getItem('opened-submenus')
  let result = saved ? JSON.parse(saved) : []
  // 过滤掉无效的菜单项（只保留有效的子菜单）
  result = result.filter((item: string) => validSubMenus.value.includes(item))
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
  if (!validSubMenus.value.includes(index)) {
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
