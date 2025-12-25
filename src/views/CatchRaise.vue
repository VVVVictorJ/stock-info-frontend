
<template>
  <div class="stock-query">
    <el-card class = "kzmk">
      <template #header>
        <div class="card-header">
          <span>实时查询符合涨停板条件的股票</span>
        </div>
      </template>
      <div class="panel-grid">
        <div class="panel-left">
          <div class="toolbar">
            <el-input
              v-model.number="limit"
              type="number"
              placeholder="返回条数（可选）"
              class="code-input"
              min="0"
            />
            <el-button :type="isRunning ? 'danger' : 'primary'" @click="toggleRun">
              {{ isRunning ? '停止' : '开始' }}
            </el-button>
            <el-button type="primary" :loading="loading" @click="loadData">刷新</el-button>
            <span v-if="nextRefreshInSeconds > 0" class="countdown">
              下次刷新：{{ nextRefreshInSeconds }}s
            </span>
          </div>
        </div>
        <div class="panel-right">
          <div class="panel-title">筛选条件</div>
          <div class="filters-actions">
            <el-button size="small" type="warning" plain @click="clearAllFilters">一键全部剔除</el-button>
          </div>
          <div class="filters">
            <div class="filter-item">
              <el-checkbox v-model="filters.f170.use">涨跌幅</el-checkbox>
              <div class="filter-controls">
                <el-input-number
                  v-model="filters.f170.min"
                  :controls="false"
                  placeholder="最小"
                  class="num-input"
                  :step="0.1"
                />
                <span class="range-sep">~</span>
                <el-input-number
                  v-model="filters.f170.max"
                  :controls="false"
                  placeholder="最大"
                  class="num-input"
                  :step="0.1"
                />
              </div>
            </div>
            <div class="filter-item">
              <el-checkbox v-model="filters.f50.use">量比</el-checkbox>
              <div class="filter-controls">
                <el-input-number
                  v-model="filters.f50.min"
                  :controls="false"
                  placeholder="最小"
                  class="num-input"
                  :step="0.1"
                />
              </div>
            </div>
            <div class="filter-item">
              <el-checkbox v-model="filters.f168.use">换手率</el-checkbox>
              <div class="filter-controls">
                <el-input-number
                  v-model="filters.f168.min"
                  :controls="false"
                  placeholder="最小"
                  class="num-input"
                  :step="0.1"
                />
              </div>
            </div>
            <div class="filter-item">
              <el-checkbox v-model="filters.f191.use">委比</el-checkbox>
              <div class="filter-controls">
                <el-input-number
                  v-model="filters.f191.min"
                  :controls="false"
                  placeholder="最小"
                  class="num-input"
                  :step="0.1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        class="mb8"
      />
      <!-- 原卡片仅用于控制面板 -->
    </el-card>
    <!-- 查询结果独立卡片 -->
    <el-card class="mt12">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
        </div>
      </template>
      <div class="result-controls">
        <el-switch v-model="dense" size="small" active-text="紧凑" />
        <el-divider direction="vertical" />
        <el-popover placement="bottom" trigger="click" :width="260">
          <template #reference>
            <el-button size="small" plain>显示列</el-button>
          </template>
          <div class="columns-panel">
            <el-checkbox-group v-model="visibleKeys">
              <el-checkbox v-for="def in fieldDefs" :key="def.key" :value="def.key">
                {{ def.label }}
              </el-checkbox>
            </el-checkbox-group>
            <div class="col-actions">
              <el-button size="small" text @click="selectAllCols">全选</el-button>
              <el-button size="small" text @click="clearAllCols">全不选</el-button>
            </div>
          </div>
        </el-popover>
      </div>
      <CatchRasieTable
        v-if="displayItems.length"
        :items="displayItems"
        :field-defs="fieldDefs"
        :dense="dense"
        :visible-keys="visibleKeys"
      />
      <div v-else class="placeholder">暂无数据</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { fetchCatchRaiseStockParam } from '@/api/stock'
import type { CatchRaiseStockData } from '@/types/stock'
import CatchRasieTable from '@/component/CatchRasieTable.vue'

const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const items = ref<CatchRaiseStockData[]>([])
const limit = ref<number | undefined>(0)
const isRunning = ref<boolean>(false)
let pollTimer: number | undefined
let backoffTimer: number | undefined
const timeoutCount = ref<number>(0)
const nextRefreshInSeconds = ref<number>(0)
let countdownTimer: number | undefined

const filters = reactive({
  f170: { use: false, min: undefined as number | undefined, max: undefined as number | undefined }, // 涨跌幅
  f50: { use: false, min: undefined as number | undefined, max: undefined as number | undefined },  // 量比
  f168: { use: false, min: undefined as number | undefined, max: undefined as number | undefined }, // 换手率
  f191: { use: false, min: undefined as number | undefined, max: undefined as number | undefined }, // 委比
})
const dense = ref<boolean>(false)
const visibleKeys = ref<string[]>([])

// 列定义映射为中文表头
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


async function loadData() {
  errorMessage.value = ''
  loading.value = true
  try {
    // 组装参数：仅在勾选时传对应参数，未提供数值则不传，使用后端默认
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
    // 成功后重置超时计数
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
      // 暂停轮询，3分钟后重试；超过3次则停止
      // 保持 isRunning 状态，清除Timers并显示退避倒计时
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
    // 正常轮询场景下更新倒计时
    if (isRunning.value && !backoffTimer) {
      scheduleCountdown(60)
    }
  }
}

onMounted(() => {
  loadData()
})

// 表格展示与样式逻辑已下沉到 CatchRasieTable 组件

const displayItems = computed<CatchRaiseStockData[]>(() => {
  if (!items.value.length) return []
  return items.value.filter((row) => {
    // 涨跌幅（f170）支持最小/最大
    if (filters.f170.use) {
      const v = Number((row as any)['f170'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f170.min === 'number' && v < filters.f170.min) return false
      if (typeof filters.f170.max === 'number' && v > filters.f170.max) return false
    }
    // 量比（f50）仅最小
    if (filters.f50.use) {
      const v = Number((row as any)['f50'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f50.min === 'number' && v < filters.f50.min) return false
    }
    // 换手率（f168）仅最小
    if (filters.f168.use) {
      const v = Number((row as any)['f168'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f168.min === 'number' && v < filters.f168.min) return false
    }
    // 委比（f191）仅最小
    if (filters.f191.use) {
      const v = Number((row as any)['f191'])
      if (Number.isNaN(v)) return false
      if (typeof filters.f191.min === 'number' && v < filters.f191.min) return false
    }
    return true
  })
})

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
  // 立即拉一次，并启动每60秒轮询
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

function selectAllCols() {
  visibleKeys.value = fieldDefs.map(d => d.key)
}
function clearAllCols() {
  visibleKeys.value = []
}

</script>


<style scoped>
.stock-query {
  padding: 8px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.code-input {
  max-width: 240px;
}
.mb8 {
  margin-bottom: 8px;
}
.placeholder {
  color: var(--el-text-color-secondary);
}
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0 12px;
}
.filter-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 8px;
}
.num-input {
  width: 120px;
}
.range-sep {
  color: var(--el-text-color-secondary);
}
.countdown {
  color: var(--el-text-color-secondary);
}
.filter-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.filters-actions {
  margin: 6px 0 8px;
}
.mt12 {
  margin-top: 12px;
}
.result-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.columns-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.col-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.panel-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.panel-left .toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.panel-right .filters {
  margin-top: 6px;
}

@media (max-width: 960px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>


