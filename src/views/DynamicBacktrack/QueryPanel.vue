<template>
  <QueryCard
    class="dynamic-backtrack-query-card"
    title="查询条件"
    :error-message="errorMessage"
    :closable="true"
    @clear-error="$emit('clear-error')"
  >
    <template #header-extra>
      <el-button
        class="collapse-button"
        text
        circle
        :title="isQueryCollapsed ? '展开查询条件' : '折叠查询条件'"
        @click="isQueryCollapsed = !isQueryCollapsed"
      >
        <el-icon>
          <CaretBottom v-if="isQueryCollapsed" />
          <CaretTop v-else />
        </el-icon>
      </el-button>
    </template>
    <div v-show="!isQueryCollapsed" class="query-content-wrapper">
      <div class="query-row">
        <div class="query-left">
          <el-date-picker
            :model-value="queryDate"
            @update:model-value="$emit('update:queryDate', $event)"
            type="date"
            placeholder="选择交易日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="date-picker"
          />
          <el-select
            :model-value="filterPlates"
            @update:model-value="$emit('update:filterPlates', $event)"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择板块（可搜索）"
            class="plate-select"
          >
            <el-option
              v-for="plate in plateOptions"
              :key="plate.plate_code"
              :label="plate.name"
              :value="plate.plate_code"
            />
          </el-select>
          <div class="slider-item">
            <span class="slider-label">回溯交易日数:</span>
            <el-slider
              :model-value="tradeDays"
              @update:model-value="$emit('update:tradeDays', $event)"
              :min="1"
              :max="30"
              show-input
              :show-input-controls="false"
              style="width: 200px"
            />
          </div>
          <div class="slider-item">
            <span class="slider-label">最少出现次数:</span>
            <el-slider
              :model-value="minOccurrences"
              @update:model-value="$emit('update:minOccurrences', $event)"
              :min="2"
              :max="10"
              show-input
              :show-input-controls="false"
              style="width: 200px"
            />
          </div>
        </div>
        <div class="query-actions">
          <el-button type="primary" :loading="loading" @click="$emit('query')">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </div>
      </div>

      <div v-show="isQueryCollapsed" class="collapsed-summary">
        <span class="summary-title">已选择</span>
        <span class="summary-item">日期：{{ summaryDate }}</span>
        <span class="summary-item">板块：{{ summaryPlates }}</span>
        <span class="summary-item">交易日数：{{ tradeDays }}</span>
        <span class="summary-item">最少次数：{{ minOccurrences }}</span>
      </div>
    </div>
  </QueryCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaretBottom, CaretTop, Search } from '@element-plus/icons-vue'
import QueryCard from '@/component/common/QueryCard.vue'

const props = defineProps<{
  queryDate: string
  filterPlates: string[]
  plateOptions: Array<{ plate_code: string; name: string }>
  tradeDays: number
  minOccurrences: number
  loading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  'update:queryDate': [value: string]
  'update:filterPlates': [value: string[]]
  'update:tradeDays': [value: number]
  'update:minOccurrences': [value: number]
  'query': []
  'clear-error': []
}>()

const isQueryCollapsed = ref(false)
const summaryDate = computed(() => props.queryDate || '未选择')
const summaryPlates = computed(() => {
  if (!props.filterPlates || props.filterPlates.length === 0) return '未选择'
  const selected = new Set(props.filterPlates)
  const names = props.plateOptions
    .filter(option => selected.has(option.plate_code))
    .map(option => option.name)
  if (names.length === 0) return `${props.filterPlates.length} 个`
  if (names.length <= 3) return names.join(' / ')
  return `${names.slice(0, 3).join(' / ')} +${names.length - 3}`
})
</script>

<style scoped>
.date-picker {
  width: 200px;
}

.plate-select {
  width: 200px;
}

:deep(.dynamic-backtrack-query-card.query-card) {
  background: transparent;
  width: 100%;
}

:deep(.dynamic-backtrack-query-card .el-card__header) {
  padding: 4px 12px;
  background: transparent;
  border-bottom: none;
  color: var(--el-text-color-regular);
}

:deep(.dynamic-backtrack-query-card .card-header) {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.7;
}

:deep(.dynamic-backtrack-query-card .el-card__body) {
  background: transparent;
  width: 100%;
  padding: 8px 12px 12px;
}

:deep(.dynamic-backtrack-query-card .query-form) {
  display: block;
  width: 100%;
}

:deep(.dynamic-backtrack-query-card.query-card) {
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

.collapse-button {
  color: var(--el-text-color-secondary);
}

.collapsed-summary {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  width: 100%;
  box-sizing: border-box;
}

.summary-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 1px;
}

.summary-item {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.slider-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  min-width: 100px;
}
</style>
