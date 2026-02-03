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
      <el-button
        v-if="hasData && selectedStockCode"
        type="success"
        size="small"
        :loading="fillingCurrentKline"
        @click="handleFillCurrentStockKline"
      >
        补齐当前股票K线
      </el-button>
      <el-button
        v-if="hasData"
        type="primary"
        size="small"
        :loading="fillingKlines"
        @click="handleFillKlines"
      >
        批量补齐K线数据
      </el-button>
    </template>

    <div class="split-container" ref="splitContainerRef">
      <!-- 左侧：股票列表 -->
      <div class="left-panel" :style="{ width: leftPanelWidth + 'px' }">
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

      <!-- 分隔线1：左侧和中间之间 -->
      <div
        class="divider resizable"
        @mousedown="handleLeftDividerMouseDown"
      ></div>

      <!-- 中间：时间序列明细 -->
      <div class="middle-panel" :style="{ width: middlePanelWidth + 'px' }">
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
            :row-class-name="getMiddleRowClassName"
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

      <!-- 分隔线2：中间和右侧之间 -->
      <div
        class="divider resizable"
        @mousedown="handleMiddleDividerMouseDown"
      ></div>

      <!-- 右侧：K线数据 -->
      <div class="right-panel" :style="{ flex: '1 1 auto' }">
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
            <el-table-column label="成交量变化比例" min-width="130" sortable align="right">
              <template #default="{ row, $index }">
                <span :class="getVolumeChangeClass(row, $index)">
                  {{ getVolumeChangeRatio(row, $index) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="volume" label="成交量" min-width="120" sortable align="right">
              <template #default="{ row }">
                {{ formatNumber(row.volume) }}
              </template>
            </el-table-column>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ResultCard from '@/component/common/ResultCard.vue'
import { formatNumber, formatDateTime } from '@/utils/formatters'
import { getChangeClass, getPriceTrend, getPriceTrendClass } from '@/utils/priceStyles'
import { fillWatchlistKlines } from '@/api/stock'
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
  'refresh': []
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

// 获取基准成交量（最早的数据，第一条记录）
const baseVolume = computed(() => {
  if (!props.rightTableData || props.rightTableData.length === 0) return null
  const firstItem = props.rightTableData[0]
  if (!firstItem) return null
  const volume = typeof firstItem.volume === 'string' ? parseFloat(firstItem.volume) : firstItem.volume
  return isNaN(volume) ? null : volume
})

// 计算成交量变化比例
function getVolumeChangeRatio(row: WatchlistKlineItem, index: number): string {
  // 第一条数据（基准）显示 "-"
  if (index === 0) return '-'

  // 如果没有基准成交量，显示 "-"
  if (baseVolume.value === null || baseVolume.value === 0) return '-'

  const currentVolume = typeof row.volume === 'string' ? parseFloat(row.volume) : row.volume
  if (isNaN(currentVolume)) return '-'

  // 计算变化比例：(当前成交量 - 基准成交量) / 基准成交量 * 100%
  const changeRatio = ((currentVolume - baseVolume.value) / baseVolume.value) * 100
  const sign = changeRatio >= 0 ? '+' : ''
  return `${sign}${changeRatio.toFixed(2)}%`
}

// 获取成交量变化比例的样式类
function getVolumeChangeClass(row: WatchlistKlineItem, index: number): string {
  // 第一条数据（基准）不显示颜色
  if (index === 0) return ''

  // 如果没有基准成交量，不显示颜色
  if (baseVolume.value === null || baseVolume.value === 0) return ''

  const currentVolume = typeof row.volume === 'string' ? parseFloat(row.volume) : row.volume
  if (isNaN(currentVolume)) return ''

  // 计算变化比例
  const changeRatio = ((currentVolume - baseVolume.value) / baseVolume.value) * 100
  if (changeRatio > 0) return 'volume-change-positive'
  if (changeRatio < 0) return 'volume-change-negative'
  return ''
}

// 提取日期部分（YYYY-MM-DD）
function extractDate(dateTimeStr: string): string {
  if (!dateTimeStr) return ''
  return dateTimeStr.split('T')[0] || dateTimeStr.substring(0, 10)
}

// 日期颜色序列（柔和的颜色）
const dateColors = [
  'date-color-0',  // 淡蓝
  'date-color-1',  // 淡绿
  'date-color-2',  // 淡橙
  'date-color-3',  // 淡紫
  'date-color-4',  // 淡青
  'date-color-5',  // 淡粉
  'date-color-6',  // 淡黄
  'date-color-7',  // 淡灰
]

// 构建日期到颜色索引的映射（用于中间面板的时间序列明细）
const middleDateColorMap = computed(() => {
  const map = new Map<string, number>()
  let colorIndex = 0
  for (const item of props.middleTableData) {
    const date = extractDate(item.created_at)
    if (!map.has(date)) {
      map.set(date, colorIndex)
      colorIndex++
    }
  }
  return map
})

// 中间表格行样式（不同天使用不同颜色）
function getMiddleRowClassName({ row }: { row: WatchlistDetailItem }): string {
  const date = extractDate(row.created_at)
  const colorIndex = middleDateColorMap.value.get(date) ?? 0
  return dateColors[colorIndex % dateColors.length] ?? 'date-color-0'
}

// 补齐K线数据相关
const fillingKlines = ref(false)
const fillingCurrentKline = ref(false)

// 处理补齐当前股票的K线数据
async function handleFillCurrentStockKline() {
  if (!props.selectedStockCode) {
    ElMessage.warning('请先选择一只股票')
    return
  }

  try {
    const result = await ElMessageBox.confirm(
      `确定要补齐股票 ${props.selectedStockCode} 的K线数据吗？`,
      '补齐当前股票K线',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
    if (result !== 'confirm') {
      return
    }
  } catch {
    // 用户取消
    return
  }

  fillingCurrentKline.value = true
  try {
    const res = await fillWatchlistKlines({
      stock_codes: [props.selectedStockCode],
    })
    const { total_stocks, success_count, failed_count, skipped_count, stock_details } = res

    let message = `补齐完成！\n`
    message += `股票代码: ${props.selectedStockCode}\n`
    if (stock_details.length > 0) {
      const detail = stock_details[0]
      if (detail) {
        message += `导入条数: ${detail.imported_count}\n`
        if (detail.error) {
          message += `提示: ${detail.error}`
        }
      }
    }

    if (failed_count > 0) {
      ElMessage.warning(message)
    } else {
      ElMessage.success(message)
    }

    // 补齐完成后自动刷新
    emit('refresh')
  } catch (err: any) {
    ElMessage.error(`补齐K线数据失败: ${err?.message || '未知错误'}`)
  } finally {
    fillingCurrentKline.value = false
  }
}

// 处理批量补齐K线数据
async function handleFillKlines() {
  try {
    const result = await ElMessageBox.confirm(
      '确定要补齐所有观察表中股票的K线数据吗？此操作可能需要较长时间。',
      '批量补齐K线数据',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
    if (result !== 'confirm') {
      return
    }
  } catch {
    // 用户取消
    return
  }

  fillingKlines.value = true
  try {
    const res = await fillWatchlistKlines({})
    const { total_stocks, success_count, failed_count, skipped_count } = res

    let message = `补齐完成！\n`
    message += `总股票数: ${total_stocks}\n`
    message += `成功: ${success_count}\n`
    message += `失败: ${failed_count}\n`
    message += `跳过: ${skipped_count}`

    if (failed_count > 0) {
      ElMessage.warning(message)
    } else {
      ElMessage.success(message)
    }

    // 补齐完成后自动刷新
    emit('refresh')
  } catch (err: any) {
    ElMessage.error(`补齐K线数据失败: ${err?.message || '未知错误'}`)
  } finally {
    fillingKlines.value = false
  }
}

// 拖动调整宽度相关
const splitContainerRef = ref<HTMLElement | null>(null)
const leftPanelWidth = ref(300) // 默认宽度 30%
const middlePanelWidth = ref(350) // 默认宽度 35%
const isResizing = ref(false)
const resizeType = ref<'left' | 'middle' | null>(null)
const startX = ref(0)
const startLeftWidth = ref(0)
const startMiddleWidth = ref(0)

// 初始化面板宽度
function initPanelWidths() {
  if (splitContainerRef.value) {
    const containerWidth = splitContainerRef.value.clientWidth
    // 减去两个分隔线的宽度（每个8px）
    const availableWidth = containerWidth - 16
    leftPanelWidth.value = Math.floor(availableWidth * 0.3)
    middlePanelWidth.value = Math.floor(availableWidth * 0.35)
  }
}

onMounted(() => {
  initPanelWidths()
  // 监听窗口大小变化
  window.addEventListener('resize', initPanelWidths)
})

// 处理左侧分隔线鼠标按下
function handleLeftDividerMouseDown(e: MouseEvent) {
  startResize(e, 'left')
}

// 处理中间分隔线鼠标按下
function handleMiddleDividerMouseDown(e: MouseEvent) {
  startResize(e, 'middle')
}

// 开始拖动
function startResize(e: MouseEvent, type: 'left' | 'middle') {
  e.preventDefault()
  e.stopPropagation()
  isResizing.value = true
  resizeType.value = type
  startX.value = e.clientX
  startLeftWidth.value = leftPanelWidth.value
  startMiddleWidth.value = middlePanelWidth.value

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// 拖动中
function handleResize(e: MouseEvent) {
  if (!isResizing.value || !resizeType.value || !splitContainerRef.value) {
    return
  }

  const containerWidth = splitContainerRef.value.clientWidth
  const deltaX = e.clientX - startX.value
  const minPanelWidth = 200
  const dividerWidth = 8
  const gap = 0

  if (resizeType.value === 'left') {
    // 调整左侧面板宽度（移除最大宽度限制，只保留最小宽度限制）
    const newLeftWidth = Math.max(minPanelWidth, startLeftWidth.value + deltaX)
    // 计算剩余可用宽度（减去左侧面板、两个分隔线）
    const remainingWidth = containerWidth - newLeftWidth - dividerWidth * 2
    // 右侧面板至少需要 minPanelWidth
    const minRightWidth = minPanelWidth
    // 中间面板至少需要 minPanelWidth
    const minMiddleWidth = minPanelWidth
    // 计算中间面板的最大允许宽度（剩余宽度减去右侧最小宽度）
    const maxMiddleWidth = remainingWidth - minRightWidth
    // 只要中间面板还有最小宽度空间，就可以继续拖动
    if (maxMiddleWidth >= minMiddleWidth) {
      leftPanelWidth.value = newLeftWidth
      // 计算中间面板的新宽度：优先保持原宽度，但如果剩余空间不足，则压缩中间面板
      if (startMiddleWidth.value > maxMiddleWidth) {
        // 中间面板需要被压缩到最小值或更小
        middlePanelWidth.value = Math.max(minMiddleWidth, maxMiddleWidth)
      } else {
        // 中间面板保持原宽度
        middlePanelWidth.value = startMiddleWidth.value
      }
    }
  } else if (resizeType.value === 'middle') {
    // 调整中间面板宽度（移除最大宽度限制，只保留最小宽度限制）
    const newMiddleWidth = Math.max(minPanelWidth, startMiddleWidth.value + deltaX)
    // 计算右侧面板可用宽度（减去左侧、中间、两个分隔线）
    const rightPanelWidth = containerWidth - leftPanelWidth.value - newMiddleWidth - dividerWidth * 2
    if (rightPanelWidth >= minPanelWidth) {
      middlePanelWidth.value = newMiddleWidth
    }
  }
}

// 停止拖动
function stopResize() {
  isResizing.value = false
  resizeType.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('resize', initPanelWidths)
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
  gap: 0;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  flex: 0 0 auto;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 中间面板 */
.middle-panel {
  flex: 0 0 auto;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 右侧面板 */
.right-panel {
  flex: 1 1 auto;
  min-width: 200px;
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
  position: relative;
}

/* 可拖动的分隔线 */
.divider.resizable {
  width: 8px;
  background: linear-gradient(to bottom, #e4e7ed 0%, #909399 50%, #e4e7ed 100%);
  cursor: col-resize;
  position: relative;
  user-select: none;
  transition: background 0.2s;
  z-index: 10;
  flex-shrink: 0;
  margin: 0 -2px;
}

.divider.resizable:hover {
  background: linear-gradient(to bottom, #409eff 0%, #66b1ff 50%, #409eff 100%);
}

.divider.resizable::before {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  top: 0;
  bottom: 0;
  cursor: col-resize;
  z-index: 11;
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

/* 成交量变化比例颜色 */
.volume-change-positive {
  color: #f56c6c;
  font-weight: 600;
}

.volume-change-negative {
  color: #67c23a;
  font-weight: 600;
}

/* 中间表格按日期分组的行背景色序列 */
.middle-table-container :deep(.date-color-0) { background-color: #e8f4fd; } /* 淡蓝 */
.middle-table-container :deep(.date-color-1) { background-color: #e8f8e8; } /* 淡绿 */
.middle-table-container :deep(.date-color-2) { background-color: #fff4e6; } /* 淡橙 */
.middle-table-container :deep(.date-color-3) { background-color: #f3e8fd; } /* 淡紫 */
.middle-table-container :deep(.date-color-4) { background-color: #e6f7f7; } /* 淡青 */
.middle-table-container :deep(.date-color-5) { background-color: #fde8f0; } /* 淡粉 */
.middle-table-container :deep(.date-color-6) { background-color: #fdfde8; } /* 淡黄 */
.middle-table-container :deep(.date-color-7) { background-color: #f5f5f5; } /* 淡灰 */

.middle-table-container :deep(.date-color-0):hover > td { background-color: #d4ebfc !important; }
.middle-table-container :deep(.date-color-1):hover > td { background-color: #d4f0d4 !important; }
.middle-table-container :deep(.date-color-2):hover > td { background-color: #ffe8cc !important; }
.middle-table-container :deep(.date-color-3):hover > td { background-color: #e8d4fc !important; }
.middle-table-container :deep(.date-color-4):hover > td { background-color: #ccefef !important; }
.middle-table-container :deep(.date-color-5):hover > td { background-color: #fcd4e4 !important; }
.middle-table-container :deep(.date-color-6):hover > td { background-color: #fcfcd4 !important; }
.middle-table-container :deep(.date-color-7):hover > td { background-color: #e8e8e8 !important; }

.middle-table-container :deep([class^="date-color-"] > td) {
  background-color: inherit !important;
}
</style>
