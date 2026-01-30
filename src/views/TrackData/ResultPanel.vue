<template>
  <ResultCard title="查询结果">
    <template #header-right>
      <div class="filter-input">
        <span class="filter-label">追踪标签:</span>
        <el-select
          :model-value="filterTrackTag"
          @update:model-value="$emit('update:filterTrackTag', $event)"
          placeholder="全部"
          clearable
          style="width: 140px"
        >
          <el-option label="14天≥3次" value="days_14" />
          <el-option label="7天≥3次" value="days_7" />
          <el-option label="3天≥3次" value="days_3" />
        </el-select>
      </div>
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
      <span v-if="hasData" class="result-stats">
        共 {{ filteredTotal }} 只股票
      </span>
    </template>

    <div class="split-container">
      <!-- 左侧：股票列表（去重） -->
      <div class="left-panel">
        <div class="panel-title">股票列表（过去出现≥3次）</div>
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
            >
              <template #default="{ row }">
                <el-tooltip :content="`跳转至东方财富网行情页面: ${row.stock_name || row.stock_code}`" placement="top">
                  <a
                    :href="buildQuoteLink(row.stock_code)"
                    class="stock-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ row.stock_code }}
                  </a>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnVisible('stock_name')"
              prop="stock_name"
              label="股票名称"
              min-width="100"
              sortable
            />
            <el-table-column
              v-if="isColumnVisible('tag')"
              prop="tag"
              label="追踪标签"
              min-width="110"
            >
              <template #default="{ row }">
                <div class="tag-container-vertical">
                  <el-tag
                    v-if="row.occurrence_stats.days_14 >= 3"
                    type="danger"
                    size="small"
                    effect="plain"
                    class="occurrence-tag"
                  >
                    14天{{ row.occurrence_stats.days_14 }}次
                  </el-tag>
                  <el-tag
                    v-if="row.occurrence_stats.days_7 >= 3"
                    type="warning"
                    size="small"
                    effect="plain"
                    class="occurrence-tag"
                  >
                    7天{{ row.occurrence_stats.days_7 }}次
                  </el-tag>
                  <el-tag
                    v-if="row.occurrence_stats.days_3 >= 3"
                    type="success"
                    size="small"
                    effect="plain"
                    class="occurrence-tag"
                  >
                    3天{{ row.occurrence_stats.days_3 }}次
                  </el-tag>
                </div>
              </template>
            </el-table-column>
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
          <span v-if="selectedStockCode">
            {{ selectedStockCode }} 历史出现记录
          </span>
          <span v-else>请选择股票</span>
          <div v-if="selectedStockCode" class="track-days-selector">
            <span class="selector-label">查看范围:</span>
            <el-radio-group
              :model-value="selectedTrackDays"
              @update:model-value="$emit('update:selectedTrackDays', $event)"
              size="small"
            >
              <el-radio-button :value="3">3天</el-radio-button>
              <el-radio-button :value="7">7天</el-radio-button>
              <el-radio-button :value="14">14天</el-radio-button>
            </el-radio-group>
          </div>
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
            <el-empty description="请从左侧选择股票查看历史出现记录" />
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
import type { TrackQueryItem, TrackDetailItem } from '@/types/trackQuery'
import { Setting } from '@element-plus/icons-vue'

const props = defineProps<{
  leftTableData: TrackQueryItem[]
  rightTableData: TrackDetailItem[]
  filterStockCode: string
  filterTrendStatus: string
  filterTrackTag: string
  selectedStockCode: string
  selectedTrackDays: number
  filteredTotal: number
  loading: boolean
  hasData: boolean
  queryDate: string
}>()

const emit = defineEmits<{
  'update:filterStockCode': [value: string]
  'update:filterTrendStatus': [value: string]
  'update:filterTrackTag': [value: string]
  'update:selectedStockCode': [value: string]
  'update:selectedTrackDays': [value: number]
}>()

const columnOptions = [
  { key: 'stock_code', label: '股票代码' },
  { key: 'stock_name', label: '股票名称' },
  { key: 'tag', label: '追踪标签' },
  { key: 'plates', label: '板块' },
]

const visibleColumns = ref(columnOptions.map(option => option.key))

function isColumnVisible(key: string) {
  return visibleColumns.value.includes(key)
}

function handleRowClick(row: TrackQueryItem) {
  emit('update:selectedStockCode', row.stock_code)
}

function getRowClassName({ row }: { row: TrackQueryItem }) {
  return row.stock_code === props.selectedStockCode ? 'selected-row' : ''
}

function buildQuoteLink(codeVal: unknown): string {
  const code = (codeVal ?? '').toString().trim()
  if (!code) return 'https://quote.eastmoney.com'
  const prefix = code.startsWith('6') ? 'sh' : 'sz'
  return `https://quote.eastmoney.com/${prefix}${code}.html`
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
  flex: 0 0 40%;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.track-days-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-label {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-regular);
  white-space: nowrap;
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

.stock-link {
  color: #0000ee;
  text-decoration: underline;
}

.stock-link:hover {
  text-decoration: underline;
}

.tag-container-vertical {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.occurrence-tag {
  width: fit-content;
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
