<template>
  <div class="scheduler-container">
    <!-- 任务卡片区 -->
    <el-card class="jobs-panel">
      <template #header>
        <div class="panel-header">
          <span>定时任务列表</span>
          <el-button @click="refreshJobs" :icon="Refresh" circle size="small" />
        </div>
      </template>

      <div class="job-cards">
        <div v-for="job in jobs" :key="job.name" class="job-card">
          <div class="job-info">
            <h3>{{ job.displayName }}</h3>
            <p class="job-desc">{{ job.description }}</p>
            <p class="job-schedule">🕒 执行时间: {{ job.schedule }}</p>
            <div class="job-status">
              <el-tag :type="getStatusType(job.name)" size="small">
                {{ getStatusText(job.name) }}
              </el-tag>
            </div>
          </div>
          <div class="job-actions">
            <el-button
              type="primary"
              @click="handleTrigger(job.name)"
              :loading="triggering[job.name]"
              :disabled="isAnyJobRunning"
            >
              手动触发
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 执行结果展示区 -->
    <el-card v-if="currentResult" class="result-panel">
      <template #header>
        <span>执行结果</span>
      </template>

      <el-result
        :icon="currentResult.success ? 'success' : 'warning'"
        :title="currentResult.message"
      >
        <template #sub-title>
          <div class="result-stats">
            <span>总计: {{ 'totalStocks' in currentResult ? currentResult.totalStocks : currentResult.totalSnapshots }}</span>
            <span>成功: {{ 'successCount' in currentResult ? currentResult.successCount : currentResult.analyzedCount }}</span>
            <span>失败: {{ 'failedCount' in currentResult ? currentResult.failedCount : currentResult.skippedCount }}</span>
          </div>
        </template>
        <template #extra>
          <el-button @click="showDetailDialog = true">查看详情</el-button>
        </template>
      </el-result>
    </el-card>

    <!-- 执行历史表格 -->
    <el-card class="history-panel">
      <template #header>
        <div class="panel-header">
          <span>执行历史</span>
          <div class="filter-controls">
            <el-select v-model="historyQuery.jobName" placeholder="任务类型" clearable @change="loadHistory">
              <el-option label="全部" value="" />
              <el-option label="K线导入" value="kline_import" />
              <el-option label="盈利分析" value="profit_analysis" />
            </el-select>
            <el-select v-model="historyQuery.status" placeholder="状态" clearable @change="loadHistory">
              <el-option label="全部" value="" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="运行中" value="running" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="historyList" v-loading="historyLoading" stripe>
        <el-table-column prop="jobName" label="任务名称" width="150">
          <template #default="{ row }">
            {{ getJobDisplayName(row.jobName) }}
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getHistoryStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="总数" width="100" align="right" />
        <el-table-column prop="successCount" label="成功" width="100" align="right" />
        <el-table-column prop="failedCount" label="失败" width="100" align="right" />
        <el-table-column prop="durationMs" label="耗时" width="120">
          <template #default="{ row }">
            {{ formatDuration(row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewHistoryDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="historyQuery.page"
          v-model:page-size="historyQuery.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="historyTotal"
          layout="total, sizes, prev, pager, next"
          @size-change="loadHistory"
          @current-change="loadHistory"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="执行详情" width="80%">
      <el-table :data="currentResult?.details" max-height="400" stripe>
        <el-table-column prop="stockCode" label="股票代码" width="120" />
        <el-table-column prop="stockName" label="股票名称" width="120" />
        <el-table-column prop="importedCount" label="导入数量" width="120" />
        <el-table-column prop="success" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error" label="错误信息" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getJobList,
  triggerKlineImport,
  triggerProfitAnalysis,
  getExecutionHistory,
  getLatestExecution
} from '@/api/scheduler'
import type {
  JobInfo,
  JobExecutionHistory,
  TriggerKlineResponse,
  TriggerProfitAnalysisResponse
} from '@/types/scheduler'
import { getWebSocketUrl } from '@/utils/websocket'

// 任务列表
const jobs = ref<JobInfo[]>([])

// 触发状态
const triggering = reactive<Record<string, boolean>>({})
const isAnyJobRunning = computed(() =>
  Object.values(triggering).some(v => v)
)

// 当前执行结果
const currentResult = ref<TriggerKlineResponse | TriggerProfitAnalysisResponse | null>(null)
const showDetailDialog = ref(false)

// 任务状态
const jobStatus = reactive<Record<string, string>>({})

// 执行历史
const historyLoading = ref(false)
const historyList = ref<JobExecutionHistory[]>([])
const historyTotal = ref(0)
const historyQuery = reactive({
  jobName: '',
  status: '',
  page: 1,
  pageSize: 20
})

// 初始化
onMounted(async () => {
  isComponentMounted = true
  await loadJobs()
  await loadHistory()
  await updateJobStatus() // 立即更新一次任务状态
  connectWebSocket() // 建立 WebSocket 连接
})

onUnmounted(() => {
  isComponentMounted = false
  disconnectWebSocket() // 清理 WebSocket 连接
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
  await loadHistory()
  ElMessage.success('刷新成功')
}

// 手动触发任务
async function handleTrigger(jobName: string) {
  if (triggering[jobName]) {
    ElMessage.warning('任务正在执行中，请稍候...')
    return
  }

  triggering[jobName] = true
  currentResult.value = null

  try {
    let res: any
    if (jobName === 'kline_import') {
      res = await triggerKlineImport()
    } else if (jobName === 'profit_analysis') {
      res = await triggerProfitAnalysis()
    }

    currentResult.value = res.data || res

    if (currentResult.value?.success) {
      ElMessage.success('任务执行成功')
    } else {
      ElMessage.warning('任务执行完成，但有部分失败')
    }

    // 刷新历史记录
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
  if (status === 'running') return 'warning'
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
}

// 获取任务状态文本
function getStatusText(jobName: string): string {
  const status = jobStatus[jobName]
  if (status === 'running') return '运行中'
  if (status === 'success') return '已完成'
  if (status === 'failed') return '失败'
  return '空闲'
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
async function viewHistoryDetail(id: number) {
  ElMessage.info('详情功能开发中...')
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
  return 'info'
}

// 格式化时长
function formatDuration(ms?: number): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

// 更新任务状态
async function updateJobStatus() {
  for (const job of jobs.value) {
    try {
      const res: any = await getLatestExecution(job.name)
      const latest = res.data || res
      if (latest) {
        jobStatus[job.name] = latest.status
      }
    } catch (error) {
      // 忽略错误
    }
  }
}

// WebSocket 连接
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let isComponentMounted = false

function connectWebSocket() {
  const wsUrl = getWebSocketUrl('/api/scheduler/ws')

  try {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket 连接已建立')
      // 清除重连定时器（如果有）
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

          // 如果任务完成，刷新历史记录
          if (data.status !== 'running') {
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

      // 只有组件仍然挂载时才重连
      if (isComponentMounted) {
        reconnectTimer = setTimeout(connectWebSocket, 3000)
      }
    }
  } catch (error) {
    console.error('WebSocket connection error:', error)
  }
}

function disconnectWebSocket() {
  // 清除重连定时器
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
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.jobs-panel,
.result-panel,
.history-panel {
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.job-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.job-card {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.job-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.job-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.job-desc {
  margin: 5px 0;
  opacity: 0.9;
  font-size: 14px;
}

.job-schedule {
  margin: 10px 0;
  font-size: 13px;
  opacity: 0.8;
}

.job-status {
  margin-top: 10px;
}

.job-actions {
  margin-top: 15px;
}

.job-actions .el-button {
  width: 100%;
}

.result-stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  font-size: 14px;
}

.result-stats span {
  padding: 5px 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .job-cards {
    grid-template-columns: 1fr;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }
}
</style>

