<template>
  <div class="scheduler-container">
    <!-- 定时任务列表 -->
    <el-card class="jobs-panel">
      <template #header>
        <div class="panel-header">
          <span>定时任务列表</span>
          <el-button @click="refreshJobs" :icon="Refresh" circle size="small" />
        </div>
      </template>

      <el-table
        :data="jobs"
        highlight-current-row
        @current-change="handleJobSelect"
        style="width: 100%"
        ref="jobTableRef"
      >
        <el-table-column prop="displayName" label="任务名称" width="160" />
        <el-table-column prop="description" label="任务描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="schedule" label="执行时间" width="200" />
        <el-table-column label="执行状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.name)" size="small">
              {{ getStatusText(row.name) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上次完成时间" width="180">
          <template #default="{ row }">
            {{ formatLastCompletedTime(row.name) }}
          </template>
        </el-table-column>
        <el-table-column label="当日执行" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="getTodayRunCount(row.name) > 0" type="success" size="small">
              {{ getTodayRunCount(row.name) }} 次
            </el-tag>
            <el-tag v-else type="info" size="small">未执行</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click.stop="handleTrigger(row.name)"
              :loading="triggering[row.name]"
              :disabled="isAnyJobRunning"
            >
              手动执行
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 执行历史表格 -->
    <div class="history-panel">
      <el-card class="history-card">
        <template #header>
          <div class="panel-header">
            <span>
              执行历史
              <el-tag v-if="selectedJob" type="info" size="small" style="margin-left: 10px">
                {{ selectedJob.displayName }}
              </el-tag>
              <span v-else class="hint-text">（点击上方任务查看对应历史）</span>
            </span>
            <div class="filter-controls">
              <el-select v-model="historyQuery.status" placeholder="状态" clearable @change="loadHistory" style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="成功" value="success" />
                <el-option label="失败" value="failed" />
                <el-option label="运行中" value="running" />
              </el-select>
            </div>
          </div>
        </template>

        <el-table
          :data="historyList"
          v-loading="historyLoading"
          stripe
          :max-height="tableMaxHeight"
          style="width: 100%"
        >
          <el-table-column prop="jobName" label="任务名称" min-width="150">
            <template #default="{ row }">
              {{ getJobDisplayName(row.jobName) }}
            </template>
          </el-table-column>
          <el-table-column prop="startedAt" label="开始时间" min-width="180" />
          <el-table-column prop="completedAt" label="完成时间" min-width="180">
            <template #default="{ row }">
              {{ row.completedAt || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" min-width="100">
            <template #default="{ row }">
              <el-tag :type="getHistoryStatusType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalCount" label="总数" min-width="80" align="right" />
          <el-table-column prop="successCount" label="成功" min-width="80" align="right" />
          <el-table-column prop="failedCount" label="失败" min-width="80" align="right" />
          <el-table-column prop="durationMs" label="耗时" min-width="100">
            <template #default="{ row }">
              {{ formatDuration(row.durationMs) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewHistoryDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <PaginationWrapper
          v-model:current-page="historyQuery.page"
          v-model:page-size="historyQuery.pageSize"
          :total="historyTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadHistory"
        />
      </el-card>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="执行详情" width="80%">
      <el-descriptions :column="3" border v-if="currentHistoryDetail">
        <el-descriptions-item label="任务名称">{{ getJobDisplayName(currentHistoryDetail.jobName) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getHistoryStatusType(currentHistoryDetail.status)" size="small">
            {{ getStatusLabel(currentHistoryDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ formatDuration(currentHistoryDetail.durationMs) }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ currentHistoryDetail.startedAt }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentHistoryDetail.completedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="统计">
          总计 {{ currentHistoryDetail.totalCount }} / 成功 {{ currentHistoryDetail.successCount }} / 失败 {{ currentHistoryDetail.failedCount }}
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="3" v-if="currentHistoryDetail.errorMessage">
          {{ currentHistoryDetail.errorMessage }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="currentHistoryDetail?.details" style="margin-top: 20px">
        <h4>执行明细</h4>
        <el-table :data="currentHistoryDetail.details" max-height="300" stripe>
          <el-table-column prop="stockCode" label="股票代码" width="120" />
          <el-table-column prop="stockName" label="股票名称" width="120" />
          <el-table-column prop="importedCount" label="导入数量" width="100" />
          <el-table-column prop="success" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="error" label="错误信息" show-overflow-tooltip />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getJobList,
  triggerKlineImport,
  triggerProfitAnalysis,
  triggerStockFilter,
  getExecutionHistory,
  getLatestExecution
} from '@/api/scheduler'
import type {
  JobInfo,
  JobExecutionHistory
} from '@/types/scheduler'
import { getWebSocketUrl } from '@/utils/websocket'
import { formatDuration } from '@/utils/formatters'
import PaginationWrapper from '@/component/common/PaginationWrapper.vue'

// 任务列表
const jobs = ref<JobInfo[]>([])
const jobTableRef = ref()
const selectedJob = ref<JobInfo | null>(null)

// 触发状态
const triggering = reactive<Record<string, boolean>>({})
const isAnyJobRunning = computed(() =>
  Object.values(triggering).some(v => v)
)

// 任务状态和最新执行信息
const jobStatus = reactive<Record<string, string>>({})
const jobLatestRun = reactive<Record<string, { startedAt: string; completedAt?: string; status: string } | null>>({})
// 今日执行次数
const jobTodayCount = reactive<Record<string, number>>({})

// 执行历史
const historyLoading = ref(false)
const historyList = ref<JobExecutionHistory[]>([])
const historyTotal = ref(0)
const tableMaxHeight = ref(300)
const historyQuery = reactive({
  jobName: '',
  status: '',
  page: 1,
  pageSize: 20
})

// 详情弹窗
const showDetailDialog = ref(false)
const currentHistoryDetail = ref<JobExecutionHistory | null>(null)

// 初始化
let isComponentMounted = false

// 计算表格最大高度
function calculateTableHeight() {
  nextTick(() => {
    const historyCard = document.querySelector('.history-card .el-card__body') as HTMLElement
    if (historyCard) {
      // 获取 el-card__body 的高度，减去 pagination 的高度（约 50px）和一些边距
      const bodyHeight = historyCard.clientHeight
      const newHeight = Math.max(200, bodyHeight - 70)
      tableMaxHeight.value = newHeight
    } else {
      // fallback: 使用窗口高度计算
      const windowHeight = window.innerHeight
      const otherHeight = 450
      const newHeight = Math.max(200, windowHeight - otherHeight)
      tableMaxHeight.value = newHeight
    }
  })
}

onMounted(async () => {
  isComponentMounted = true
  await loadJobs()
  await loadHistory()
  await updateJobStatus()
  await loadTodayExecutionCounts()
  connectWebSocket()

  // 计算表格高度
  calculateTableHeight()
  window.addEventListener('resize', calculateTableHeight)
})

onUnmounted(() => {
  isComponentMounted = false
  disconnectWebSocket()
  window.removeEventListener('resize', calculateTableHeight)
})

// 加载任务列表
async function loadJobs() {
  try {
    const res: any = await getJobList()
    jobs.value = res.data || res
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  }
}

// 刷新任务
async function refreshJobs() {
  await loadJobs()
  await updateJobStatus()
  await loadTodayExecutionCounts()
  await loadHistory()
  ElMessage.success('刷新成功')
}

// 选中任务变化
function handleJobSelect(job: JobInfo | null) {
  selectedJob.value = job
  historyQuery.jobName = job?.name || ''
  historyQuery.page = 1
  loadHistory()
}

// 手动触发任务
async function handleTrigger(jobName: string) {
  if (triggering[jobName]) {
    ElMessage.warning('任务正在执行中，请稍候...')
    return
  }

  triggering[jobName] = true

  try {
    let res: any
    if (jobName === 'kline_import') {
      res = await triggerKlineImport()
    } else if (jobName === 'profit_analysis') {
      res = await triggerProfitAnalysis()
    } else if (jobName === 'stock_filter_morning' || jobName === 'stock_filter_afternoon') {
      res = await triggerStockFilter()
    }

    const result = res.data || res

    if (result?.success) {
      ElMessage.success('任务执行成功')
    } else {
      ElMessage.warning('任务执行完成，但有部分失败')
    }

    // 刷新数据
    await updateJobStatus()
    await loadTodayExecutionCounts()
    await loadHistory()
  } catch (error: any) {
    ElMessage.error(error?.message || '任务执行失败')
  } finally {
    triggering[jobName] = false
  }
}

// 获取任务状态类型
function getStatusType(jobName: string): string {
  const status = jobStatus[jobName]
  // 如果当日未执行，显示 info 类型
  if (getTodayRunCount(jobName) === 0) return 'info'
  if (status === 'running') return 'warning'
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
}

// 获取任务状态文本
function getStatusText(jobName: string): string {
  const status = jobStatus[jobName]
  // 如果当日未执行，显示"未执行"
  if (getTodayRunCount(jobName) === 0) return '未执行'
  if (status === 'running') return '运行中'
  if (status === 'success') return '已完成'
  if (status === 'failed') return '失败'
  return '空闲'
}

// 获取状态标签
function getStatusLabel(status: string): string {
  if (status === 'running') return '运行中'
  if (status === 'success') return '成功'
  if (status === 'failed') return '失败'
  if (status === 'partial') return '部分成功'
  return status
}

// 格式化上次完成时间
function formatLastCompletedTime(jobName: string): string {
  const latestRun = jobLatestRun[jobName]
  if (!latestRun) return '从未执行'

  const dateStr = latestRun.completedAt || latestRun.startedAt
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  if (isToday) {
    return `今日 ${hours}:${minutes}`
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }
}

// 获取今日执行次数
function getTodayRunCount(jobName: string): number {
  return jobTodayCount[jobName] || 0
}

// 加载执行历史
async function loadHistory() {
  historyLoading.value = true
  try {
    const res: any = await getExecutionHistory(historyQuery)
    const data = res.data || res
    historyList.value = data.items || []
    historyTotal.value = data.total || 0
  } catch (error) {
    ElMessage.error('加载历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

// 查看历史详情
function viewHistoryDetail(row: JobExecutionHistory) {
  currentHistoryDetail.value = row
  showDetailDialog.value = true
}

// 获取任务显示名称
function getJobDisplayName(jobName: string): string {
  const job = jobs.value.find(j => j.name === jobName)
  return job?.displayName || jobName
}

// 获取历史状态类型
function getHistoryStatusType(status: string): string {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'running') return 'warning'
  if (status === 'partial') return 'warning'
  return 'info'
}

// 更新任务状态
async function updateJobStatus() {
  for (const job of jobs.value) {
    try {
      const res: any = await getLatestExecution(job.name)
      const latest = res.data || res
      if (latest) {
        jobStatus[job.name] = latest.status
        jobLatestRun[job.name] = {
          startedAt: latest.startedAt,
          completedAt: latest.completedAt,
          status: latest.status
        }
      } else {
        jobLatestRun[job.name] = null
      }
    } catch (error) {
      // 忽略错误
    }
  }
}

// 加载今日执行次数
async function loadTodayExecutionCounts() {
  // 获取今天的日期字符串（用于过滤）
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`

  for (const job of jobs.value) {
    try {
      // 获取该任务的历史记录（第一页，较大的 pageSize）
      const res: any = await getExecutionHistory({ jobName: job.name, page: 1, pageSize: 100 })
      const data = res.data || res
      const items: JobExecutionHistory[] = data.items || []

      // 统计今日执行次数
      const todayCount = items.filter(item => {
        if (!item.startedAt) return false
        return item.startedAt.startsWith(todayStr)
      }).length

      jobTodayCount[job.name] = todayCount
    } catch (error) {
      jobTodayCount[job.name] = 0
    }
  }
}

// WebSocket 连接
let ws: WebSocket | null = null
let reconnectTimer: number | null = null

function connectWebSocket() {
  const wsUrl = getWebSocketUrl('/api/scheduler/ws')

  try {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket 连接已建立')
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'connected') {
          console.log('WebSocket 连接成功')
          return
        }

        // 更新任务状态
        if (data.job_name && data.status) {
          jobStatus[data.job_name] = data.status

          // 如果任务完成，刷新数据
          if (data.status !== 'running') {
            updateJobStatus()
            loadTodayExecutionCounts()
            loadHistory()
          }
        }
      } catch (err) {
        console.error('解析 WebSocket 消息失败:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket 连接已关闭')
      if (isComponentMounted) {
        reconnectTimer = setTimeout(connectWebSocket, 3000)
      }
    }
  } catch (error) {
    console.error('WebSocket connection error:', error)
  }
}

function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (ws) {
    ws.close()
    ws = null
  }
}
</script>

<style scoped>
.scheduler-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
  padding: 20px;
  box-sizing: border-box;
  background: #f5f7fa;
  gap: 20px;
  overflow: hidden;
}

.jobs-panel {
  flex-shrink: 0;
}

.history-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.history-card :deep(.el-card__header) {
  flex-shrink: 0;
}

.history-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 15px;
}

.history-card :deep(.el-table) {
  flex: 1;
}

.history-card :deep(.el-table__inner-wrapper) {
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint-text {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.not-run-today {
  color: #909399;
  font-size: 12px;
}

/* 表格行可点击样式 */
.jobs-panel :deep(.el-table__row) {
  cursor: pointer;
}

.jobs-panel :deep(.el-table__row:hover) {
  background-color: #ecf5ff;
}

.jobs-panel :deep(.el-table__row.current-row) {
  background-color: #ecf5ff;
}

/* 响应式 */
@media (max-width: 1200px) {
  .scheduler-container {
    height: auto;
    min-height: 100vh;
  }

  .history-panel {
    min-height: 400px;
  }
}
</style>
