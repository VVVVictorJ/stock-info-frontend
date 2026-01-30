<template>
  <QueryCard
    class="track-query-card"
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
      </div>

      <div class="range-panel">
        <div class="range-header">
          <span class="range-title">区间筛选</span>
          <div class="range-actions">
            <el-button
              class="collapse-button"
              text
              circle
              :title="isRangeCollapsed ? '展开区间筛选' : '折叠区间筛选'"
              @click="isRangeCollapsed = !isRangeCollapsed"
            >
              <el-icon>
                <CaretBottom v-if="isRangeCollapsed" />
                <CaretTop v-else />
              </el-icon>
            </el-button>
            <el-button
              class="range-clear"
              size="small"
              circle
              title="清空区间筛选"
              @click="clearRangeFilters"
            >
              <el-icon><CircleClose /></el-icon>
            </el-button>
          </div>
        </div>

        <div v-show="!isRangeCollapsed" class="range-row range-row-single">
          <div class="range-filter">
            <span class="range-label">涨跌幅(%):</span>
            <el-input-number
              :model-value="rangeFilters.changePctMin"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, changePctMin: $event })"
              controls-position="right"
              class="range-input"
            />
            <span class="range-separator">~</span>
            <el-input-number
              :model-value="rangeFilters.changePctMax"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, changePctMax: $event })"
              controls-position="right"
              class="range-input"
            />
          </div>
          <div class="range-filter">
            <span class="range-label">量比:</span>
            <el-input-number
              :model-value="rangeFilters.volumeRatioMin"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, volumeRatioMin: $event })"
              controls-position="right"
              class="range-input"
            />
            <span class="range-separator">~</span>
            <el-input-number
              :model-value="rangeFilters.volumeRatioMax"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, volumeRatioMax: $event })"
              controls-position="right"
              class="range-input"
            />
          </div>
          <div class="range-filter">
            <span class="range-label">换手率(%):</span>
            <el-input-number
              :model-value="rangeFilters.turnoverRateMin"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, turnoverRateMin: $event })"
              controls-position="right"
              class="range-input"
            />
            <span class="range-separator">~</span>
            <el-input-number
              :model-value="rangeFilters.turnoverRateMax"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, turnoverRateMax: $event })"
              controls-position="right"
              class="range-input"
            />
          </div>
          <div class="range-filter">
            <span class="range-label">委比:</span>
            <el-input-number
              :model-value="rangeFilters.bidAskRatioMin"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, bidAskRatioMin: $event })"
              controls-position="right"
              class="range-input"
            />
            <span class="range-separator">~</span>
            <el-input-number
              :model-value="rangeFilters.bidAskRatioMax"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, bidAskRatioMax: $event })"
              controls-position="right"
              class="range-input"
            />
          </div>
          <div class="range-filter">
            <span class="range-label">主力资金流入:</span>
            <el-input-number
              :model-value="rangeFilters.mainForceInflowMin"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, mainForceInflowMin: $event })"
              controls-position="right"
              class="range-input"
            />
            <span class="range-separator">~</span>
            <el-input-number
              :model-value="rangeFilters.mainForceInflowMax"
              @update:model-value="$emit('update:rangeFilters', { ...rangeFilters, mainForceInflowMax: $event })"
              controls-position="right"
              class="range-input"
            />
          </div>
        </div>
      </div>
    </div>
  </QueryCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaretBottom, CaretTop, CircleClose, Search } from '@element-plus/icons-vue'
import QueryCard from '@/component/common/QueryCard.vue'

const props = defineProps<{
  queryDate: string
  filterPlates: string[]
  plateOptions: Array<{ plate_code: string; name: string }>
  rangeFilters: {
    changePctMin: number | null
    changePctMax: number | null
    volumeRatioMin: number | null
    volumeRatioMax: number | null
    turnoverRateMin: number | null
    turnoverRateMax: number | null
    bidAskRatioMin: number | null
    bidAskRatioMax: number | null
    mainForceInflowMin: number | null
    mainForceInflowMax: number | null
  }
  loading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  'update:queryDate': [value: string]
  'update:filterPlates': [value: string[]]
  'update:rangeFilters': [value: {
    changePctMin: number | null
    changePctMax: number | null
    volumeRatioMin: number | null
    volumeRatioMax: number | null
    turnoverRateMin: number | null
    turnoverRateMax: number | null
    bidAskRatioMin: number | null
    bidAskRatioMax: number | null
    mainForceInflowMin: number | null
    mainForceInflowMax: number | null
  }]
  'query': []
  'clear-error': []
}>()

const isQueryCollapsed = ref(false)
const isRangeCollapsed = ref(false)
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

function clearRangeFilters() {
  emit('update:rangeFilters', {
    ...props.rangeFilters,
    changePctMin: null,
    changePctMax: null,
    volumeRatioMin: null,
    volumeRatioMax: null,
    turnoverRateMin: null,
    turnoverRateMax: null,
    bidAskRatioMin: null,
    bidAskRatioMax: null,
    mainForceInflowMin: null,
    mainForceInflowMax: null,
  })
}
</script>

<style scoped>
.date-picker {
  width: 200px;
}

.plate-select {
  width: 200px;
}

:deep(.track-query-card.query-card) {
  background: transparent;
  width: 100%;
}

:deep(.track-query-card .el-card__header) {
  padding: 4px 12px;
  background: transparent;
  border-bottom: none;
  color: var(--el-text-color-regular);
}

:deep(.track-query-card .card-header) {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.7;
}

:deep(.track-query-card .el-card__body) {
  background: transparent;
  width: 100%;
  padding: 8px 12px 12px;
}

:deep(.track-query-card .query-form) {
  display: block;
  width: 100%;
}

:deep(.track-query-card.query-card) {
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

.range-panel {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 18px rgba(31, 45, 61, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  width: 100%;
  box-sizing: border-box;
}

.range-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.range-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.range-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}

.range-clear {
  color: var(--el-text-color-secondary);
}

.range-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px 16px;
}

.range-row-single {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px 12px;
}

.range-row + .range-row {
  margin-top: 8px;
}

.range-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.range-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  min-width: 56px;
  text-align: right;
}

.range-input {
  width: 86px;
}

:deep(.range-input .el-input__inner) {
  height: 28px;
  font-size: 12px;
  padding: 0 8px;
}

:deep(.range-input .el-input-number__decrease),
:deep(.range-input .el-input-number__increase) {
  width: 18px;
}

.range-separator {
  color: var(--el-text-color-regular);
}
</style>
