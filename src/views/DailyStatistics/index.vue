<template>
  <div class="page-container">
    <el-card shadow="never" class="calendar-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="title-group">
            <span class="title">每日统计</span>
            <span class="subtitle">按自然日统计 stock_snapshots 抓取的去重股票支数</span>
          </div>
          <div class="header-controls">
            <span class="month-summary">{{ monthSummary }}</span>
            <el-select
              v-model="selectedYear"
              class="year-select"
              @change="applyYearMonth"
            >
              <el-option v-for="y in yearOptions" :key="y" :label="`${y}年`" :value="y" />
            </el-select>
            <el-select
              v-model="selectedMonth"
              class="month-select"
              @change="applyYearMonth"
            >
              <el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m" />
            </el-select>
            <el-button type="primary" plain @click="goToday">回到今天</el-button>
          </div>
        </div>
      </template>
      <el-config-provider :locale="zhCn">
        <el-calendar v-model="calendarDate">
          <template #date-cell="{ data }">
            <div
              class="date-cell"
              :class="{
                'is-other-month': data.type !== 'current-month',
                'has-data': getCount(data.day) !== undefined,
              }"
            >
              <span class="day-number">{{ dayOfMonth(data.day) }}</span>
              <span v-if="getCount(data.day) !== undefined" class="stock-count">
                {{ getCount(data.day) }} 支
              </span>
            </div>
          </template>
        </el-calendar>
      </el-config-provider>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { fetchDailyStockCounts } from '@/api/stock'

const calendarDate = ref(new Date())
const countMap = ref<Map<string, number>>(new Map())
const loading = ref(false)

const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

const yearOptions = computed(() => {
  const y = now.getFullYear()
  const list: number[] = []
  for (let i = y - 6; i <= y + 1; i++) list.push(i)
  return list
})

// 年月下拉变化：同步日历到该月（当前年月则定位到今天）
function applyYearMonth() {
  const isCurrent =
    selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth() + 1
  calendarDate.value = isCurrent
    ? new Date()
    : new Date(selectedYear.value, selectedMonth.value - 1, 1)
}

function goToday() {
  selectedYear.value = now.getFullYear()
  selectedMonth.value = now.getMonth() + 1
  calendarDate.value = new Date()
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 日历网格可见范围（周一起、周日止），覆盖前后月溢出的几天
function visibleRange(base: Date): { start: string; end: string } {
  const year = base.getFullYear()
  const month = base.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startOffset = (first.getDay() + 6) % 7
  const endOffset = (7 - last.getDay()) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - startOffset)
  const end = new Date(last)
  end.setDate(last.getDate() + endOffset)
  return { start: formatDate(start), end: formatDate(end) }
}

const currentMonthKey = computed(() => {
  const d = calendarDate.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

const monthSummary = computed(() => {
  const prefix = `${currentMonthKey.value}-`
  let days = 0
  let max = 0
  for (const [date, count] of countMap.value) {
    if (date.startsWith(prefix)) {
      days += 1
      if (count > max) max = count
    }
  }
  return days === 0 ? '本月暂无抓取数据' : `本月共抓取 ${days} 天，单日最多 ${max} 支`
})

function getCount(day: string): number | undefined {
  return countMap.value.get(day)
}

function dayOfMonth(day: string): number {
  return Number(day.split('-')[2])
}

async function loadData() {
  loading.value = true
  try {
    const { start, end } = visibleRange(calendarDate.value)
    const list = await fetchDailyStockCounts({ start, end })
    countMap.value = new Map(list.map((item) => [item.date, item.count]))
  } catch (e: any) {
    ElMessage.error(e?.message ?? '每日统计加载失败')
  } finally {
    loading.value = false
  }
}

// 月份变化（下拉切换 / 点击前后月格子）：同步下拉框并重新拉取数据
watch(currentMonthKey, () => {
  selectedYear.value = calendarDate.value.getFullYear()
  selectedMonth.value = calendarDate.value.getMonth() + 1
  loadData()
})
onMounted(loadData)
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(to bottom, #f5f7fa 0%, #e8eaf0 100%);
}

.calendar-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-card :deep(.el-card__body) {
  flex: 1;
  overflow: auto;
  padding-top: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title-group {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.subtitle {
  font-size: 12px;
  color: #909399;
}

.month-summary {
  font-size: 13px;
  color: #409eff;
  white-space: nowrap;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.year-select {
  width: 110px;
}

.month-select {
  width: 90px;
}

/* 隐藏日历自带的上月/下月头部，改用年月下拉快速跳转 */
.calendar-card :deep(.el-calendar__header) {
  display: none;
}

.date-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  height: 100%;
}

.day-number {
  font-size: 14px;
  line-height: 1.2;
}

.is-other-month .day-number {
  color: #c0c4cc;
}

.stock-count {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 4px;
  padding: 2px 6px;
  line-height: 1.4;
}

:deep(.el-calendar-table td.is-today .stock-count) {
  color: #fff;
  background: #409eff;
}

:deep(.el-calendar-table td.is-today .day-number) {
  color: #409eff;
  font-weight: 700;
}
</style>
