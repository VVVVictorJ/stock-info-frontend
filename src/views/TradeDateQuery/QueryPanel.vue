<template>
  <QueryCard
    title="查询条件"
    :error-message="errorMessage"
    :closable="true"
    @clear-error="$emit('clear-error')"
  >
    <div class="query-row">
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
      <el-button type="primary" :loading="loading" @click="$emit('query')">
        <el-icon><Search /></el-icon>
        查询
      </el-button>
    </div>

    <div class="query-row">
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
    </div>

    <div class="query-row">
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
  </QueryCard>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import QueryCard from '@/component/common/QueryCard.vue'

defineProps<{
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

defineEmits<{
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
</script>

<style scoped>
.date-picker {
  width: 200px;
}

.plate-select {
  width: 200px;
}

.query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.range-filter {
  display: flex;
  align-items: center;
  gap: 6px;
}

.range-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.range-input {
  width: 120px;
}

.range-separator {
  color: var(--el-text-color-regular);
}
</style>
