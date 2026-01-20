<template>
  <ResultCard title="查询结果">
    <template #header-right>
      <div class="filter-input">
        <span class="filter-label">涨跌状态:</span>
        <el-select
          :model-value="filterTrendStatus"
          @update:model-value="$emit('update:filterTrendStatus', $event)"
          placeholder="全部"
          clearable
          style="width: 120px"
        >
          <el-option label="上涨" value="up" />
          <el-option label="下跌" value="down" />
          <el-option label="持平" value="flat" />
        </el-select>
      </div>
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
      <el-popover placement="bottom-end" trigger="click" popper-class="column-config-popper">
        <template #reference>
          <el-button class="column-config-button" size="small" circle>
            <el-icon><Setting /></el-icon>
          </el-button>
        </template>
        <div class="column-config">
          <div class="column-config-title">显示列</div>
          <el-checkbox-group v-model="visibleColumns">
            <el-checkbox
              v-for="column in columnOptions"
              :key="column.key"
              :label="column.key"
            >
              {{ column.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-popover>
      <el-button
        class="refresh-plates-button"
        size="small"
        circle
        :loading="refreshing"
        title="补全板块并刷新"
        @click="$emit('refresh-plates')"
      >
        <el-icon><Refresh /></el-icon>
      </el-button>
      <span v-if="hasData" class="result-stats">
        共 {{ filteredTotal }} 只股票
      </span>
    </template>

    <div class="split-container">
      <!-- 左侧：股票列表（去重） -->
      <div class="left-panel">
        <div class="panel-title">股票列表</div>
        <div class="left-table-container">
          <el-table
            :data="leftTableData"
            stripe
            highlight-current-row
            style="width: 100%"
            height="100%"
            v-loading="loading"
            @row-click="handleRowClick"
            :row-class-name="getRowClassName"
          >
            <el-table-column
              v-if="isColumnVisible('stock_code')"
              prop="stock_code"
              label="股票代码"
              min-width="100"
              sortable
            />
            <el-table-column
              v-if="isColumnVisible('stock_name')"
              prop="stock_name"
              label="股票名称"
              min-width="120"
              sortable
            />
            <el-table-column v-if="isColumnVisible('plates')" label="板块" min-width="200">
              <template #default="{ row }">
                <div v-if="row.plates && row.plates.length" class="plate-tags">
                  <el-tag
                    v-for="plate in row.plates"
                    :key="plate.plate_code"
                    size="small"
                    class="plate-tag"
                    effect="light"
                  >
                    {{ plate.name }}
                  </el-tag>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 右侧：时间序列明细 -->
      <div class="right-panel">
        <div class="panel-title">
          {{ selectedStockCode ? `${selectedStockCode} 时间序列明细` : '请选择股票' }}
        </div>
        <div class="right-table-container">
          <el-table
            v-if="selectedStockCode"
            :data="rightTableData"
            stripe
            style="width: 100%"
            height="100%"
          >
            <el-table-column prop="latest_price" label="最新价" min-width="100" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.latest_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="close_price" label="收盘价" min-width="100" sortable align="right">
              <template #default="{ row }">
                {{ row.close_price ? formatNumber(row.close_price) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="涨跌状态" min-width="100" align="center">
              <template #default="{ row }">
                <span :class="getPriceTrendClass(row)">
                  {{ getPriceTrend(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="change_pct" label="涨跌幅(%)" min-width="110" sortable align="right">
              <template #default="{ row }">
                <span :class="getChangeClass(row.change_pct)">
                  {{ formatNumber(row.change_pct) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="volume_ratio" label="量比" min-width="100" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.volume_ratio) }}
              </template>
            </el-table-column>
            <el-table-column prop="turnover_rate" label="换手率(%)" min-width="110" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.turnover_rate) }}%
              </template>
            </el-table-column>
            <el-table-column prop="bid_ask_ratio" label="委比" min-width="100" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.bid_ask_ratio) }}
              </template>
            </el-table-column>
            <el-table-column prop="main_force_inflow" label="主力资金流入" min-width="140" sortable align="right">
              <template #default="{ row }">
                <span class="highlight">
                  {{ formatNumber(row.main_force_inflow) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" min-width="180" sortable>
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-hint">
            <el-empty description="请从左侧选择股票查看详细信息" />
          </div>
        </div>
      </div>
    </div>
  </ResultCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ResultCard from '@/component/common/ResultCard.vue'
import { formatNumber, formatDateTime } from '@/utils/formatters'
import { getChangeClass, getPriceTrend, getPriceTrendClass } from '@/utils/priceStyles'
import type { TradeDateQueryItem } from '@/types/tradeDateQuery'
import { Refresh, Setting } from '@element-plus/icons-vue'

const props = defineProps<{
  leftTableData: TradeDateQueryItem[]
  rightTableData: TradeDateQueryItem[]
  filterStockCode: string
  filterTrendStatus: string
  selectedStockCode: string
  filteredTotal: number
  loading: boolean
  hasData: boolean
  refreshing: boolean
}>()

const emit = defineEmits<{
  'update:filterStockCode': [value: string]
  'update:filterTrendStatus': [value: string]
  'update:selectedStockCode': [value: string]
  'refresh-plates': []
}>()

const columnOptions = [
  { key: 'stock_code', label: '股票代码' },
  { key: 'stock_name', label: '股票名称' },
  { key: 'plates', label: '板块' },
]

const visibleColumns = ref(columnOptions.map(option => option.key))

function isColumnVisible(key: string) {
  return visibleColumns.value.includes(key)
}

function handleRowClick(row: TradeDateQueryItem) {
  emit('update:selectedStockCode', row.stock_code)
}

function getRowClassName({ row }: { row: TradeDateQueryItem }) {
  return row.stock_code === props.selectedStockCode ? 'selected-row' : ''
}
</script>

<style scoped>
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

.column-config-button {
  margin-left: 4px;
}

.refresh-plates-button {
  margin-left: 4px;
}

.column-config {
  min-width: 160px;
  max-width: 220px;
  max-height: 260px;
  overflow: auto;
}

.column-config-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.column-config :deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:global(.column-config-popper) {
  max-width: 240px;
  overflow: hidden;
}

/* 左右分栏容器 */
.split-container {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  flex: 0 0 30%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 面板标题 */
.panel-title {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
  flex-shrink: 0;
}

/* 分隔线 */
.divider {
  width: 1px;
  background: linear-gradient(to bottom, #e4e7ed 0%, #909399 50%, #e4e7ed 100%);
  flex-shrink: 0;
}

/* 左侧表格容器 */
.left-table-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 右侧表格容器 */
.right-table-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 空提示 */
.empty-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 左表格样式 */
.left-table-container :deep(.el-table) {
  flex: 1;
  max-height: 100%;
  cursor: pointer;
}

.left-table-container :deep(.el-table__inner-wrapper) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.left-table-container :deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto !important;
}

.left-table-container :deep(.el-table__header-wrapper) {
  flex-shrink: 0;
}

/* 选中行高亮 */
.left-table-container :deep(.selected-row) {
  background-color: #ecf5ff !important;
}

.left-table-container :deep(.selected-row):hover > td {
  background-color: #ecf5ff !important;
}

.plate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.plate-tag {
  margin: 2px 0;
}

/* 右表格样式 */
.right-table-container :deep(.el-table) {
  flex: 1;
  max-height: 100%;
}

.right-table-container :deep(.el-table__inner-wrapper) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.right-table-container :deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto !important;
}

.right-table-container :deep(.el-table__header-wrapper) {
  flex-shrink: 0;
}

/* 数值颜色 - 中国股市习惯：红涨绿跌 */
.positive {
  color: #f56c6c;
  font-weight: 600;
}

.negative {
  color: #67c23a;
  font-weight: 600;
}

.highlight {
  color: #e6a23c;
  font-weight: 600;
}

/* 涨跌状态样式 */
.trend-up {
  color: #f56c6c;
  font-weight: 600;
}

.trend-down {
  color: #67c23a;
  font-weight: 600;
}

.trend-flat {
  color: #909399;
}
</style>
