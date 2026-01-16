<template>
  <div class="catch-raise-page">
    <QueryPanel
      :limit="limit"
      :is-running="isRunning"
      :loading="loading"
      :next-refresh-in-seconds="nextRefreshInSeconds"
      :filters="filters"
      :error-message="errorMessage"
      @update:limit="limit = $event"
      @toggle-run="toggleRun"
      @refresh="loadData"
      @clear-filters="clearAllFilters"
      @update:filters="filters = $event"
    />
    <ResultPanel
      :items="displayItems"
      :field-defs="fieldDefs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { fetchCatchRaiseStockParam } from '@/api/stock'
import type { CatchRaiseStockData } from '@/types/stock'
import QueryPanel, { type Filters } from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const items = ref<CatchRaiseStockData[]>([])
const limit = ref<number | undefined>(0)

// 轮询状态
const isRunning = ref<boolean>(false)
let pollTimer: number | undefined
let backoffTimer: number | undefined
const timeoutCount = ref<number>(0)
const nextRefreshInSeconds = ref<number>(0)
let countdownTimer: number | undefined

// 筛选条件
const filters = reactive<Filters>({
  f170: { use: false, min: undefined, max: undefined },
  f50: { use: false, min: undefined, max: undefined },
  f168: { use: false, min: undefined, max: undefined },
  f191: { use: false, min: undefined, max: undefined },
})

// 列定义
const fieldDefs = [
  { key: 'f57', label: '代码' },
  { key: 'f58', label: '名称' },
  { key: 'f43', label: '最新价' },
  { key: 'f170', label: '涨跌幅' },
  { key: 'f50', label: '量比' },
  { key: 'f168', label: '换手率' },
  { key: 'f191', label: '委比' },
  { key: 'f137', label: '主力净流入' },
] as const

// 数据加载
async function loadData() {
  errorMessage.value = ''
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (typeof limit.value === 'number') {
      params.limit = limit.value
    }
    if (filters.f170.use) {
      if (typeof filters.f170.min === 'number') params.pct_min = filters.f170.min
      if (typeof filters.f170.max === 'number') params.pct_max = filters.f170.max
    }
    if (filters.f50.use) {
      if (typeof filters.f50.min === 'number') params.lb_min = filters.f50.min
    }
    if (filters.f168.use) {
      if (typeof filters.f168.min === 'number') params.hs_min = filters.f168.min
    }
    if (filters.f191.use) {
      if (typeof filters.f191.min === 'number') params.wb_min = filters.f191.min
    }

    const res = await fetchCatchRaiseStockParam(params as any)
    items.value = res.items ?? []
    timeoutCount.value = 0
  } catch (err: any) {
    const msg = (err?.message ?? '').toString().toLowerCase()
    const isTimeout =
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('超过')
    if (isTimeout) {
      timeoutCount.value += 1
      errorMessage.value = '请求超时，3分钟后自动刷新'
      clearTimers()
      scheduleCountdown(180)
      if (timeoutCount.value > 3) {
        errorMessage.value = '请求多次超时，已停止自动刷新'
        stopPolling()
      } else {
        backoffTimer = window.setTimeout(() => {
          if (!isRunning.value) return
          startPolling(true)
        }, 3 * 60 * 1000)
      }
    } else {
      errorMessage.value = err?.message ?? '加载失败'
    }
  } finally {
    loading.value = false
    if (isRunning.value && !backoffTimer) {
      scheduleCountdown(60)
    }
  }
}

// 筛选后的显示数据
const displayItems = computed<CatchRaiseStockData[]>(() => {
  if (!items.value.length) return []
  return items.value.filter((row) => {
    if (filters.f170.use) {
      const v = Number((row as any)['f170'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f170.min === 'number' && v < filters.f170.min) return false
      if (typeof filters.f170.max === 'number' && v > filters.f170.max) return false
    }
    if (filters.f50.use) {
      const v = Number((row as any)['f50'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f50.min === 'number' && v < filters.f50.min) return false
    }
    if (filters.f168.use) {
      const v = Number((row as any)['f168'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f168.min === 'number' && v < filters.f168.min) return false
    }
    if (filters.f191.use) {
      const v = Number((row as any)['f191'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f191.min === 'number' && v < filters.f191.min) return false
    }
    return true
  })
})

// 轮询控制
function clearTimers() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = undefined
  }
  if (backoffTimer) {
    window.clearTimeout(backoffTimer)
    backoffTimer = undefined
  }
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
    countdownTimer = undefined
  }
}

function startPolling(fromBackoff = false) {
  clearTimers()
  isRunning.value = true
  if (!fromBackoff) {
    timeoutCount.value = 0
  }
  loadData()
  pollTimer = window.setInterval(() => {
    loadData()
  }, 60 * 1000)
  scheduleCountdown(60)
}

function stopPolling(resetFlag = true) {
  clearTimers()
  if (resetFlag) {
    timeoutCount.value = 0
  }
  isRunning.value = false
  nextRefreshInSeconds.value = 0
}

function toggleRun() {
  if (isRunning.value) {
    stopPolling()
  } else {
    startPolling()
  }
}

function scheduleCountdown(seconds: number) {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
    countdownTimer = undefined
  }
  nextRefreshInSeconds.value = Math.max(0, Math.floor(seconds))
  if (nextRefreshInSeconds.value <= 0) return
  countdownTimer = window.setInterval(() => {
    nextRefreshInSeconds.value = Math.max(0, nextRefreshInSeconds.value - 1)
    if (nextRefreshInSeconds.value <= 0 && countdownTimer) {
      window.clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }, 1000)
}

function clearAllFilters() {
  filters.f170.use = false
  filters.f170.min = undefined
  filters.f170.max = undefined
  filters.f50.use = false
  filters.f50.min = undefined
  filters.f168.use = false
  filters.f168.min = undefined
  filters.f191.use = false
  filters.f191.min = undefined
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.catch-raise-page {
  padding: 8px;
}
</style>
