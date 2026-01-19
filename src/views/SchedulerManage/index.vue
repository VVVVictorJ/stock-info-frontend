<template>
  <div class="scheduler-container">
    <JobsPanel
      :jobs="jobs"
      :triggering="triggering"
      :is-any-job-running="isAnyJobRunning"
      :job-status="jobStatus"
      :job-latest-run="jobLatestRun"
      :job-today-count="jobTodayCount"
      @refresh="refreshJobs"
      @trigger="handleTrigger"
      @select="handleJobSelect"
    />

    <HistoryPanel
      :selected-job="selectedJob"
      :history-list="historyList"
      :loading="historyLoading"
      :table-max-height="tableMaxHeight"
      :total="historyTotal"
      v-model:current-page="historyQuery.page"
      v-model:page-size="historyQuery.pageSize"
      v-model:status-filter="historyQuery.status"
      :jobs="jobs"
      @load="loadHistory"
      @view-detail="viewHistoryDetail"
    />

    <DetailDialog
      v-model:visible="showDetailDialog"
      :detail="currentHistoryDetail"
      :jobs="jobs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getJobList,
  triggerKlineImport,
  triggerProfitAnalysis,
  triggerStockFilter,
  triggerStockTableSync,
  triggerStockPlateSync,
  getExecutionHistory,
  getLatestExecution
} from '@/api/scheduler'
import type {
  JobInfo,
  JobExecutionHistory
} from '@/types/scheduler'
import { getWebSocketUrl } from '@/utils/websocket'
import JobsPanel from './JobsPanel.vue'
import HistoryPanel from './HistoryPanel.vue'
import DetailDialog from './DetailDialog.vue'

// 任务列表
const jobs = ref<JobInfo[]>([])
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
    let branch = 'none'
    if (jobName === 'kline_import') {
      branch = 'kline_import'
      res = await triggerKlineImport()
    } else if (jobName === 'profit_analysis') {
      branch = 'profit_analysis'
      res = await triggerProfitAnalysis()
    } else if (jobName === 'stock_filter_morning' || jobName === 'stock_filter_afternoon') {
      branch = 'stock_filter'
      res = await triggerStockFilter()
    } else if (jobName === 'stock_table_sync') {
      branch = 'stock_table_sync'
      res = await triggerStockTableSync()
    } else if (jobName === 'stock_plate_sync') {
      branch = 'stock_plate_sync'
      res = await triggerStockPlateSync()
    } else {
      branch = 'unknown'
      ElMessage.error(`未知任务: ${jobName}`)
      return
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

/* 响应式 */
@media (max-width: 1200px) {
  .scheduler-container {
    height: auto;
    min-height: 100vh;
  }
}
</style>
