<template>
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
            <el-select
              :model-value="statusFilter"
              @update:model-value="$emit('update:statusFilter', $event)"
              placeholder="状态"
              clearable
              style="width: 120px"
            >
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
        v-loading="loading"
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
            <el-button link type="primary" @click="$emit('view-detail', row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <PaginationWrapper
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @update:current-page="$emit('update:currentPage', $event)"
        @update:page-size="$emit('update:pageSize', $event)"
        @change="$emit('load')"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import PaginationWrapper from '@/component/common/PaginationWrapper.vue'
import { formatDuration } from '@/utils/formatters'
import type { JobInfo, JobExecutionHistory } from '@/types/scheduler'

const props = defineProps<{
  selectedJob: JobInfo | null
  historyList: JobExecutionHistory[]
  loading: boolean
  tableMaxHeight: number
  total: number
  currentPage: number
  pageSize: number
  statusFilter: string
  jobs: JobInfo[]
}>()

defineEmits<{
  'update:statusFilter': [value: string]
  'update:currentPage': [value: number]
  'update:pageSize': [value: number]
  'load': []
  'view-detail': [row: JobExecutionHistory]
}>()

// 获取任务显示名称
function getJobDisplayName(jobName: string): string {
  const job = props.jobs.find(j => j.name === jobName)
  return job?.displayName || jobName
}

// 获取状态标签
function getStatusLabel(status: string): string {
  if (status === 'running') return '运行中'
  if (status === 'success') return '成功'
  if (status === 'failed') return '失败'
  if (status === 'partial') return '部分成功'
  return status
}

// 获取历史状态类型
function getHistoryStatusType(status: string): string {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'running') return 'warning'
  if (status === 'partial') return 'warning'
  return 'info'
}
</script>

<style scoped>
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
</style>
