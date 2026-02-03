<template>
  <ResultCard title="查询结果">
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
      <span v-if="hasData" class="result-stats">
        共 {{ filteredTotal }} 只股票
      </span>
    </template>

    <div class="split-container">
      <!-- 左侧：股票列表 -->
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
              prop="stock_name"
              label="股票名称"
              min-width="100"
              sortable
            />
            <el-table-column label="板块" min-width="150">
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

      <!-- 中间：时间序列明细 -->
      <div class="middle-panel">
        <div class="panel-title">
          <span v-if="selectedStockCode">
            {{ selectedStockCode }} 时间序列明细
          </span>
          <span v-else>请选择股票</span>
        </div>
        <div class="middle-table-container">
          <el-table
            v-if="selectedStockCode"
            :data="middleTableData"
            style="width: 100%"
            height="100%"
            v-loading="loadingDetail"
          >
            <el-table-column prop="latest_price" label="最新价" min-width="90" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.latest_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="close_price" label="收盘价" min-width="90" sortable align="right">
              <template #default="{ row }">
                {{ row.close_price ? formatNumber(row.close_price) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="涨跌状态" min-width="90" align="center">
              <template #default="{ row }">
                <span :class="getPriceTrendClass(row)">
                  {{ getPriceTrend(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="change_pct" label="涨跌幅(%)" min-width="100" sortable align="right">
              <template #default="{ row }">
                <span :class="getChangeClass(row.change_pct)">
                  {{ formatNumber(row.change_pct) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="volume_ratio" label="量比" min-width="80" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.volume_ratio) }}
              </template>
            </el-table-column>
            <el-table-column prop="turnover_rate" label="换手率(%)" min-width="100" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.turnover_rate) }}%
              </template>
            </el-table-column>
            <el-table-column prop="bid_ask_ratio" label="委比" min-width="80" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.bid_ask_ratio) }}
              </template>
            </el-table-column>
            <el-table-column prop="main_force_inflow" label="主力资金流入" min-width="120" sortable align="right">
              <template #default="{ row }">
                <span :class="getMainForceClass(row.main_force_inflow)">
                  {{ formatNumber(row.main_force_inflow) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" min-width="160" sortable>
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-hint">
            <el-empty description="请从左侧选择股票查看时间序列明细" />
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 右侧：K线数据 -->
      <div class="right-panel">
        <div class="panel-title">
          <span v-if="selectedStockCode">
            {{ selectedStockCode }} K线数据
          </span>
          <span v-else>请选择股票</span>
          <span v-if="selectedStockCode && klineDateRange" class="date-range">
            {{ klineDateRange }}
          </span>
        </div>
        <div class="right-table-container">
          <el-table
            v-if="selectedStockCode"
            :data="rightTableData"
            style="width: 100%"
            height="100%"
            v-loading="loadingKline"
          >
            <el-table-column prop="trade_date" label="交易日期" min-width="110" sortable />
            <el-table-column prop="open_price" label="开盘价" min-width="90" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.open_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="high_price" label="最高价" min-width="90" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.high_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="low_price" label="最低价" min-width="90" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.low_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="close_price" label="收盘价" min-width="90" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.close_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="volume" label="成交量" min-width="120" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.volume) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="成交额" min-width="120" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.amount) }}
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-hint">
            <el-empty description="请从左侧选择股票查看K线数据" />
          </div>
        </div>
      </div>
    </div>
  </ResultCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResultCard from '@/component/common/ResultCard.vue'
import { formatNumber, formatDateTime } from '@/utils/formatters'
import { getChangeClass, getPriceTrend, getPriceTrendClass } from '@/utils/priceStyles'
import type { WatchlistQueryItem, WatchlistDetailItem, WatchlistKlineItem } from '@/types/watchlistQuery'

const props = defineProps<{
  leftTableData: WatchlistQueryItem[]
  middleTableData: WatchlistDetailItem[]
  rightTableData: WatchlistKlineItem[]
  filterStockCode: string
  selectedStockCode: string
  filteredTotal: number
  loading: boolean
  loadingDetail: boolean
  loadingKline: boolean
  hasData: boolean
  klineStartDate: string | null
  klineEndDate: string | null
}>()

const emit = defineEmits<{
  'update:filterStockCode': [value: string]
  'update:selectedStockCode': [value: string]
}>()

function handleRowClick(row: WatchlistQueryItem) {
  emit('update:selectedStockCode', row.stock_code)
}

function getRowClassName({ row }: { row: WatchlistQueryItem }) {
  return row.stock_code === props.selectedStockCode ? 'selected-row' : ''
}

function buildQuoteLink(codeVal: unknown): string {
  const code = (codeVal ?? '').toString().trim()
  if (!code) return 'https://quote.eastmoney.com'
  const prefix = code.startsWith('6') ? 'sh' : 'sz'
  return `https://quote.eastmoney.com/${prefix}${code}.html`
}

// 主力资金流入颜色：正数红色，负数绿色
function getMainForceClass(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'main-force-neutral'
  return num >= 0 ? 'main-force-positive' : 'main-force-negative'
}

// K线日期范围显示
const klineDateRange = computed(() => {
  if (!props.klineStartDate || !props.klineEndDate) return null
  return `${props.klineStartDate} ~ ${props.klineEndDate}`
})
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

/* 三栏分栏容器 */
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

/* 中间面板 */
.middle-panel {
  flex: 0 0 35%;
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

.date-range {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

/* 分隔线 */
.divider {
  width: 1px;
  background: linear-gradient(to bottom, #e4e7ed 0%, #909399 50%, #e4e7ed 100%);
  flex-shrink: 0;
}

/* 表格容器 */
.left-table-container,
.middle-table-container,
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

/* 表格样式 */
.left-table-container :deep(.el-table),
.middle-table-container :deep(.el-table),
.right-table-container :deep(.el-table) {
  flex: 1;
  max-height: 100%;
  cursor: pointer;
}

.left-table-container :deep(.el-table__inner-wrapper),
.middle-table-container :deep(.el-table__inner-wrapper),
.right-table-container :deep(.el-table__inner-wrapper) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.left-table-container :deep(.el-table__body-wrapper),
.middle-table-container :deep(.el-table__body-wrapper),
.right-table-container :deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto !important;
}

.left-table-container :deep(.el-table__header-wrapper),
.middle-table-container :deep(.el-table__header-wrapper),
.right-table-container :deep(.el-table__header-wrapper) {
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

.plate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.plate-tag {
  margin: 2px 0;
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

/* 主力资金流入颜色 */
.main-force-positive {
  color: rgb(238, 0, 0);
  font-weight: 600;
}

.main-force-negative {
  color: rgb(0, 139, 0);
  font-weight: 600;
}

.main-force-neutral {
  color: #909399;
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
