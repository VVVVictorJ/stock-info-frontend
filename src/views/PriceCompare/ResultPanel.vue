<template>
  <ResultCard title="价格对比分析">
    <template #header-info>
      <span v-if="responseData" class="date-info">
        快照日期: {{ responseData.snapshot_date || '-' }} / 交易日期: {{ responseData.trade_date || '-' }}
      </span>
    </template>
    <template #header-right>
      <div class="filter-input">
        <span class="filter-label">股票代码:</span>
        <el-input
          :model-value="filterStockCode"
          @update:model-value="$emit('update:filterStockCode', $event)"
          placeholder="输入股票代码筛选"
          clearable
          style="width: 180px"
        />
      </div>
      <span v-if="responseData" class="result-stats">
        共 {{ filteredTotal }} 条，当前第 {{ currentPage }}/{{ totalPages }} 页
      </span>
    </template>

    <div class="table-wrapper">
      <div class="table-container">
        <el-table
          :data="tableData"
          stripe
          style="width: 100%"
          height="100%"
          v-loading="loading"
        >
          <el-table-column prop="stock_code" label="股票代码" min-width="100" sortable />
          <el-table-column prop="stock_name" label="股票名称" min-width="100" sortable />
          <el-table-column prop="grade" label="盈利等级" min-width="100" sortable align="center">
            <template #default="{ row }">
              <span :class="getGradeClass(row.grade)">
                {{ row.grade }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="latest_price" label="最新价" min-width="100" sortable align="right">
            <template #default="{ row }">
              {{ formatNumber(row.latest_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="open_price" label="开盘价" min-width="100" sortable align="right">
            <template #default="{ row }">
              {{ formatNumber(row.open_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="high_price" label="最高价" min-width="100" sortable align="right">
            <template #default="{ row }">
              {{ formatNumber(row.high_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="low_price" label="最低价" min-width="100" sortable align="right">
            <template #default="{ row }">
              {{ formatNumber(row.low_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="close_price" label="收盘价" min-width="100" sortable align="right">
            <template #default="{ row }">
              {{ formatNumber(row.close_price) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" min-width="180" sortable>
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <PaginationWrapper
        :current-page="currentPage"
        :page-size="currentPageSize"
        :total="totalRecords"
        :page-sizes="[20, 50, 100]"
        @update:current-page="$emit('update:currentPage', $event)"
        @update:page-size="$emit('update:currentPageSize', $event)"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('current-change', $event)"
      />
    </div>
  </ResultCard>
</template>

<script setup lang="ts">
import ResultCard from '@/component/common/ResultCard.vue'
import PaginationWrapper from '@/component/common/PaginationWrapper.vue'
import { formatNumber, formatDateTime } from '@/utils/formatters'
import { getGradeClass } from '@/utils/priceStyles'
import type { PriceCompareResponse, PriceCompareItem } from '@/types/priceCompare'

defineProps<{
  responseData: PriceCompareResponse | null
  tableData: PriceCompareItem[]
  filterStockCode: string
  filteredTotal: number
  currentPage: number
  currentPageSize: number
  totalPages: number
  totalRecords: number
  loading: boolean
}>()

defineEmits<{
  'update:filterStockCode': [value: string]
  'update:currentPage': [value: number]
  'update:currentPageSize': [value: number]
  'size-change': [size: number]
  'current-change': [page: number]
}>()
</script>

<style scoped>
.date-info {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 4px 12px;
  border-radius: 4px;
}

.filter-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: normal;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.result-stats {
  font-size: 14px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 表格样式 */
.table-container :deep(.el-table) {
  height: 100%;
}

.table-container :deep(.el-table__inner-wrapper) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-container :deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto !important;
}

.table-container :deep(.el-table__header-wrapper) {
  flex-shrink: 0;
}

/* 盈利等级颜色 */
.grade-a {
  color: #67c23a;
  font-weight: 700;
  font-size: 16px;
}

.grade-b {
  color: #409eff;
  font-weight: 700;
  font-size: 16px;
}

.grade-c {
  color: #909399;
  font-weight: 600;
  font-size: 16px;
}

/* 表格斑马纹渐变 */
:deep(.el-table__row:hover) {
  background: linear-gradient(to right, #f5f7fa 0%, #fff 100%) !important;
}
</style>
