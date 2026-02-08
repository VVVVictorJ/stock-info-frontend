<template>
  <QueryCard
    class="trend-query-card"
    title="AI 趋势分析"
    :error-message="errorMessage"
    :closable="true"
    @clear-error="$emit('clear-error')"
  >
    <div class="query-content-wrapper">
      <div class="query-row">
        <div class="query-left">
          <el-select
            :model-value="selectedStockCode"
            @update:model-value="$emit('update:selectedStockCode', $event)"
            filterable
            clearable
            placeholder="选择观察表中的股票"
            class="stock-select"
          >
            <el-option
              v-for="stock in stockOptions"
              :key="stock.stock_code"
              :label="`${stock.stock_code}${stock.stock_name ? ' ' + stock.stock_name : ''}`"
              :value="stock.stock_code"
            />
          </el-select>

          <el-select
            :model-value="selectedHistoryId"
            @update:model-value="handleHistorySelect($event)"
            clearable
            placeholder="查看历史分析记录"
            class="history-select"
          >
            <el-option
              v-for="item in historyOptions"
              :key="item.id"
              :label="formatHistoryLabel(item)"
              :value="item.id"
            >
              <div class="history-option">
                <span class="history-stock">{{ item.stock_code }}</span>
                <el-tag
                  :type="getStatusType(item.status)"
                  size="small"
                  class="history-status"
                >
                  {{ getStatusLabel(item.status) }}
                </el-tag>
                <span class="history-time">{{ formatTime(item.created_at) }}</span>
                <span v-if="item.duration_ms" class="history-duration">
                  {{ (item.duration_ms / 1000).toFixed(1) }}s
                </span>
              </div>
            </el-option>
          </el-select>
        </div>
        <div class="query-actions">
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!selectedStockCode"
            @click="$emit('analyze')"
          >
            <el-icon><MagicStick /></el-icon>
            开始分析
          </el-button>
        </div>
      </div>
    </div>
  </QueryCard>
</template>

<script setup lang="ts">
import { MagicStick } from '@element-plus/icons-vue'
import QueryCard from '@/component/common/QueryCard.vue'
import type { TrendHistoryItem } from '@/types/aiAnalysis'

defineProps<{
  selectedStockCode: string
  selectedHistoryId: number | null
  stockOptions: Array<{ stock_code: string; stock_name: string | null }>
  historyOptions: TrendHistoryItem[]
  loading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  'update:selectedStockCode': [value: string]
  'update:selectedHistoryId': [value: number | null]
  'analyze': []
  'load-detail': [id: number]
  'clear-error': []
}>()

function handleHistorySelect(id: number | null) {
  emit('update:selectedHistoryId', id)
  if (id !== null) {
    emit('load-detail', id)
  }
}

function formatHistoryLabel(item: TrendHistoryItem): string {
  const time = formatTime(item.created_at)
  return `${item.stock_code} - ${getStatusLabel(item.status)} - ${time}`
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}

function getStatusType(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'warning'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return '已完成'
    case 'processing': return '分析中'
    case 'failed': return '失败'
    case 'pending': return '等待中'
    default: return status
  }
}
</script>

<style scoped>
.stock-select {
  width: 260px;
}

.history-select {
  width: 360px;
}

:deep(.trend-query-card.query-card) {
  background: transparent;
  width: 100%;
}

:deep(.trend-query-card .el-card__header) {
  padding: 4px 12px;
  background: transparent;
  border-bottom: none;
  color: var(--el-text-color-regular);
}

:deep(.trend-query-card .card-header) {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.7;
}

:deep(.trend-query-card .el-card__body) {
  background: transparent;
  width: 100%;
  padding: 8px 12px 12px;
}

:deep(.trend-query-card .query-form) {
  display: block;
  width: 100%;
}

:deep(.trend-query-card.query-card) {
  margin-bottom: 8px;
}

.query-content-wrapper {
  width: 100%;
  box-sizing: border-box;
}

.query-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px 16px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(31, 45, 61, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-sizing: border-box;
}

.query-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.query-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* 历史记录下拉选项样式 */
.history-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.history-stock {
  font-weight: 600;
  min-width: 60px;
}

.history-status {
  flex-shrink: 0;
}

.history-time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.history-duration {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}
</style>
