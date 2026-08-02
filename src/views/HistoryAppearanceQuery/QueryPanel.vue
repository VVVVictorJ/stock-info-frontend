<template>
  <QueryCard
    class="appearance-query-card"
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
          <el-input
            :model-value="stockCode"
            @update:model-value="$emit('update:stockCode', $event)"
            placeholder="股票代码（模糊）"
            clearable
            class="code-input"
            @keyup.enter="$emit('query')"
          />
          <el-input
            :model-value="stockName"
            @update:model-value="$emit('update:stockName', $event)"
            placeholder="股票名称（模糊）"
            clearable
            class="name-input"
            @keyup.enter="$emit('query')"
          />
          <el-select
            :model-value="plateCode"
            @update:model-value="$emit('update:plateCode', $event)"
            filterable
            clearable
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
    </div>
    <div v-show="isQueryCollapsed" class="collapsed-summary">
      <span class="summary-title">已选择</span>
      <span class="summary-item">代码：{{ stockCode || '未填写' }}</span>
      <span class="summary-item">名称：{{ stockName || '未填写' }}</span>
      <span class="summary-item">板块：{{ summaryPlate }}</span>
    </div>
  </QueryCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaretBottom, CaretTop, Search } from '@element-plus/icons-vue'
import QueryCard from '@/component/common/QueryCard.vue'
import type { StockPlateListItem } from '@/types/stockPlate'

const props = defineProps<{
  stockCode: string
  stockName: string
  plateCode: string
  plateOptions: StockPlateListItem[]
  loading: boolean
  errorMessage: string
}>()

defineEmits<{
  'update:stockCode': [value: string]
  'update:stockName': [value: string]
  'update:plateCode': [value: string]
  'query': []
  'clear-error': []
}>()

const isQueryCollapsed = ref(false)

const summaryPlate = computed(() => {
  if (!props.plateCode) return '未选择'
  const plate = props.plateOptions.find(option => option.plate_code === props.plateCode)
  return plate ? plate.name : props.plateCode
})
</script>

<style scoped>
.code-input {
  width: 180px;
}

.name-input {
  width: 180px;
}

.plate-select {
  width: 220px;
}

:deep(.appearance-query-card.query-card) {
  background: transparent;
  width: 100%;
}

:deep(.appearance-query-card .el-card__header) {
  padding: 4px 12px;
  background: transparent;
  border-bottom: none;
  color: var(--el-text-color-regular);
}

:deep(.appearance-query-card .card-header) {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.7;
}

:deep(.appearance-query-card .el-card__body) {
  background: transparent;
  width: 100%;
  padding: 8px 12px 12px;
}

:deep(.appearance-query-card .query-form) {
  display: block;
  width: 100%;
}

:deep(.appearance-query-card.query-card) {
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
</style>
