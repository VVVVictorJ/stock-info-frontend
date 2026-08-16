<template>
  <ResultCard title="查询结果">
    <template #header-right>
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
        class="download-button"
        size="small"
        circle
        title="下载当前结果"
        @click="handleDownload"
      >
        <el-icon><Download /></el-icon>
      </el-button>
      <el-button
        class="export-image-button"
        size="small"
        circle
        title="导出股票代码图片"
        :loading="exporting"
        :disabled="exporting || leftTableData.length === 0"
        @click="handleExportImage"
      >
        <el-icon><Picture /></el-icon>
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

      <!-- 右侧：历史出现记录 -->
      <div class="right-panel">
        <div class="panel-title">
          {{ selectedStockCode ? `${selectedStockCode} 历史出现记录` : '请选择股票' }}
        </div>
        <div class="right-table-container">
          <el-table
            v-if="selectedStockCode"
            :data="rightTableData"
            stripe
            style="width: 100%"
            height="100%"
            :default-sort="{ prop: 'created_at', order: 'descending' }"
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
                <span :class="getMainForceClass(row.main_force_inflow)">
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
import { exportStockListToXlsx } from '@/utils/exportExcel'
import {
  generateStockCodesBlob,
  downloadPngBlob,
  supportsImageClipboard,
  writeImageToClipboard,
} from '@/utils/exportImage'
import type { StockAppearanceQueryItem } from '@/types/stockAppearanceQuery'
import { Setting, Download, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  leftTableData: StockAppearanceQueryItem[]
  rightTableData: StockAppearanceQueryItem[]
  selectedStockCode: string
  filteredTotal: number
  loading: boolean
  hasData: boolean
}>()

const emit = defineEmits<{
  'update:selectedStockCode': [value: string]
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

function handleRowClick(row: StockAppearanceQueryItem) {
  emit('update:selectedStockCode', row.stock_code)
}

function getRowClassName({ row }: { row: StockAppearanceQueryItem }) {
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

async function handleDownload() {
  if (props.leftTableData.length === 0) {
    ElMessage.warning('当前无可导出数据')
    return
  }

  const now = new Date()
  const exportDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  await exportStockListToXlsx({
    stocks: props.leftTableData,
    date: exportDate,
    fileName: `history-appearance-query-${exportDate}.xlsx`,
  })
}

// ==================== 股票代码导出图片 ====================
const exporting = ref(false)

async function handleExportImage() {
  if (props.leftTableData.length === 0) {
    ElMessage.warning('暂无可导出的股票代码')
    return
  }
  if (exporting.value) return

  exporting.value = true
  try {
    const codes = props.leftTableData.map(item => item.stock_code)

    // 在用户激活窗口内构造剪贴板写入（ClipboardItem 接受 Promise，兼容 Safari）
    const blobPromise = generateStockCodesBlob(codes)
    const clipboardPromise = supportsImageClipboard()
      ? writeImageToClipboard(blobPromise)
      : Promise.resolve(false)

    const blob = await blobPromise
    if (!blob) throw new Error('canvas toBlob returned null')

    downloadPngBlob(blob)

    const copied = await clipboardPromise
    if (copied) {
      ElMessage.success('图片已下载并复制到剪贴板')
    } else {
      ElMessage.warning('图片已下载（当前浏览器不支持复制图片到剪贴板）')
    }
  } catch (err) {
    console.error('[export-image]', err)
    ElMessage.error('图片生成失败，请重试')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.result-stats {
  font-size: 14px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.column-config-button {
  margin-left: 4px;
}

.download-button {
  margin-left: 4px;
}

.export-image-button {
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
