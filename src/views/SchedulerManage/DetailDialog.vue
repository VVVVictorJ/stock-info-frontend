<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="执行详情" width="80%">
    <el-descriptions :column="3" border v-if="detail">
      <el-descriptions-item label="任务名称">{{ getJobDisplayName(detail.jobName) }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getHistoryStatusType(detail.status)" size="small">
          {{ getStatusLabel(detail.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="耗时">{{ formatDuration(detail.durationMs) }}</el-descriptions-item>
      <el-descriptions-item label="开始时间">{{ detail.startedAt }}</el-descriptions-item>
      <el-descriptions-item label="完成时间">{{ detail.completedAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="统计">
        总计 {{ detail.totalCount }} / 成功 {{ detail.successCount }} / 失败 {{ detail.failedCount }}
      </el-descriptions-item>
      <el-descriptions-item label="错误信息" :span="3" v-if="detail.errorMessage">
        {{ detail.errorMessage }}
      </el-descriptions-item>
    </el-descriptions>
    <div v-if="detail?.details" style="margin-top: 20px">
      <h4>执行明细</h4>
      <el-table :data="detail.details" max-height="300" stripe>
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
</template>

<script setup lang="ts">
import { formatDuration } from '@/utils/formatters'
import type { JobInfo, JobExecutionHistory } from '@/types/scheduler'

const props = defineProps<{
  visible: boolean
  detail: JobExecutionHistory | null
  jobs: JobInfo[]
}>()

defineEmits<{
  'update:visible': [value: boolean]
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
