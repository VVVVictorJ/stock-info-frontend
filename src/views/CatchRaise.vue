
<template>
  <div class="stock-query">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>实时查询符合涨停板条件的股票</span>
        </div>
      </template>
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
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        class="mb8"
      />
      <el-table
        v-if="items.length"
        :data="items"
        size="small"
        border
        stripe
      >
        <el-table-column
          v-for="def in fieldDefs"
          :key="def.key"
          :prop="def.key"
          :label="def.label"
          :min-width="def.key === 'f58' ? 140 : 100"
        >
          <template #default="{ row }">
            <span :class="isPnField(def.key) ? getPnClass(row[def.key]) : ''">
              <template v-if="def.key === 'f137'">
                {{ formatThousand(row[def.key]) }}
              </template>
              <template v-else>
                {{ row[def.key] }}
              </template>
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="placeholder">
        暂无数据
      </div>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchCatchRaiseStock } from '@/api/stock'
import type { CatchRaiseStockData } from '@/types/stock'

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
    const res = await fetchCatchRaiseStock({
      limit: limit.value,
    })
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

function isPnField(key: string): boolean {
  return key === 'f170' || key === 'f191' || key === 'f137' || key === 'f50' || key === 'f168'
}

function getPnClass(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return ''
  if (num > 0) return 'pn-pos'
  if (num < 0) return 'pn-neg'
  return ''
}

function formatThousand(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return String(value ?? '')
  return new Intl.NumberFormat('en-US').format(num)
}

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
.pn-pos {
  color: var(--el-color-danger);
}
.pn-neg {
  color: var(--el-color-success);
}
</style>


