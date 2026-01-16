<template>
  <el-card class="jobs-panel">
    <template #header>
      <div class="panel-header">
        <span>定时任务列表</span>
        <el-button @click="$emit('refresh')" :icon="Refresh" circle size="small" />
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
            @click.stop="$emit('trigger', row.name)"
            :loading="triggering[row.name]"
            :disabled="isAnyJobRunning"
          >
            手动执行
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import type { JobInfo } from '@/types/scheduler'

const props = defineProps<{
  jobs: JobInfo[]
  triggering: Record<string, boolean>
  isAnyJobRunning: boolean
  jobStatus: Record<string, string>
  jobLatestRun: Record<string, { startedAt: string; completedAt?: string; status: string } | null>
  jobTodayCount: Record<string, number>
}>()

const emit = defineEmits<{
  'refresh': []
  'trigger': [jobName: string]
  'select': [job: JobInfo | null]
}>()

const jobTableRef = ref()

function handleJobSelect(job: JobInfo | null) {
  emit('select', job)
}

// 获取任务状态类型
function getStatusType(jobName: string): string {
  const status = props.jobStatus[jobName]
  // 如果当日未执行，显示 info 类型
  if (getTodayRunCount(jobName) === 0) return 'info'
  if (status === 'running') return 'warning'
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
}

// 获取任务状态文本
function getStatusText(jobName: string): string {
  const status = props.jobStatus[jobName]
  // 如果当日未执行，显示"未执行"
  if (getTodayRunCount(jobName) === 0) return '未执行'
  if (status === 'running') return '运行中'
  if (status === 'success') return '已完成'
  if (status === 'failed') return '失败'
  return '空闲'
}

// 格式化上次完成时间
function formatLastCompletedTime(jobName: string): string {
  const latestRun = props.jobLatestRun[jobName]
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
  return props.jobTodayCount[jobName] || 0
}
</script>

<style scoped>
.jobs-panel {
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>
