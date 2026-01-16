<template>
  <el-card class="query-panel">
    <template #header>
      <div class="card-header">
        <span>实时查询符合涨停板条件的股票</span>
      </div>
    </template>
    <div class="panel-grid">
      <div class="panel-left">
        <div class="toolbar">
          <el-input
            :model-value="limit"
            type="number"
            placeholder="返回条数（可选）"
            class="code-input"
            min="0"
            @update:model-value="$emit('update:limit', Number($event))"
          />
          <el-button :type="isRunning ? 'danger' : 'primary'" @click="$emit('toggle-run')">
            {{ isRunning ? '停止' : '开始' }}
          </el-button>
          <el-button type="primary" :loading="loading" @click="$emit('refresh')">刷新</el-button>
          <span v-if="nextRefreshInSeconds > 0" class="countdown">
            下次刷新：{{ nextRefreshInSeconds }}s
          </span>
        </div>
      </div>
      <div class="panel-right">
        <div class="panel-title">筛选条件</div>
        <div class="filters-actions">
          <el-button size="small" type="warning" plain @click="$emit('clear-filters')">一键全部剔除</el-button>
        </div>
        <div class="filters">
          <div class="filter-item">
            <el-checkbox
              :model-value="filters.f170.use"
              @update:model-value="updateFilter('f170', 'use', $event)"
            >涨跌幅</el-checkbox>
            <div class="filter-controls">
              <el-input-number
                :model-value="filters.f170.min"
                :controls="false"
                placeholder="最小"
                class="num-input"
                :step="0.1"
                @update:model-value="updateFilter('f170', 'min', $event)"
              />
              <span class="range-sep">~</span>
              <el-input-number
                :model-value="filters.f170.max"
                :controls="false"
                placeholder="最大"
                class="num-input"
                :step="0.1"
                @update:model-value="updateFilter('f170', 'max', $event)"
              />
            </div>
          </div>
          <div class="filter-item">
            <el-checkbox
              :model-value="filters.f50.use"
              @update:model-value="updateFilter('f50', 'use', $event)"
            >量比</el-checkbox>
            <div class="filter-controls">
              <el-input-number
                :model-value="filters.f50.min"
                :controls="false"
                placeholder="最小"
                class="num-input"
                :step="0.1"
                @update:model-value="updateFilter('f50', 'min', $event)"
              />
            </div>
          </div>
          <div class="filter-item">
            <el-checkbox
              :model-value="filters.f168.use"
              @update:model-value="updateFilter('f168', 'use', $event)"
            >换手率</el-checkbox>
            <div class="filter-controls">
              <el-input-number
                :model-value="filters.f168.min"
                :controls="false"
                placeholder="最小"
                class="num-input"
                :step="0.1"
                @update:model-value="updateFilter('f168', 'min', $event)"
              />
            </div>
          </div>
          <div class="filter-item">
            <el-checkbox
              :model-value="filters.f191.use"
              @update:model-value="updateFilter('f191', 'use', $event)"
            >委比</el-checkbox>
            <div class="filter-controls">
              <el-input-number
                :model-value="filters.f191.min"
                :controls="false"
                placeholder="最小"
                class="num-input"
                :step="0.1"
                @update:model-value="updateFilter('f191', 'min', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <ErrorAlert :message="errorMessage" />
  </el-card>
</template>

<script setup lang="ts">
import ErrorAlert from '@/component/common/ErrorAlert.vue'

export interface FilterItem {
  use: boolean
  min: number | undefined
  max?: number | undefined
}

export interface Filters {
  f170: FilterItem
  f50: FilterItem
  f168: FilterItem
  f191: FilterItem
}

const props = defineProps<{
  limit: number | undefined
  isRunning: boolean
  loading: boolean
  nextRefreshInSeconds: number
  filters: Filters
  errorMessage: string
}>()

const emit = defineEmits<{
  'update:limit': [value: number]
  'toggle-run': []
  'refresh': []
  'clear-filters': []
  'update:filters': [filters: Filters]
}>()

function updateFilter(filterKey: keyof Filters, field: 'use' | 'min' | 'max', value: any) {
  const newFilters = { ...props.filters }
  newFilters[filterKey] = { ...newFilters[filterKey], [field]: value }
  emit('update:filters', newFilters)
}
</script>

<style scoped>
.query-panel {
  flex-shrink: 0;
}

.card-header {
  font-weight: 600;
}

.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.code-input {
  max-width: 240px;
}

.countdown {
  color: var(--el-text-color-secondary);
}

.panel-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.filters-actions {
  margin: 6px 0 8px;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.filter-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 8px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.num-input {
  width: 120px;
}

.range-sep {
  color: var(--el-text-color-secondary);
}

@media (max-width: 960px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
