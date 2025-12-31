<template>
  <div class="page-container">
    <!-- 查询面板 -->
    <el-card class="query-panel">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
        </div>
      </template>
      <div class="query-form">
        <el-date-picker
          v-model="queryDate"
          type="date"
          placeholder="选择交易日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />
        <el-button type="primary" :loading="loading" @click="handleInitialQuery">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
        class="error-alert"
      />
    </el-card>

    <!-- 结果面板 -->
    <el-card class="result-panel">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="header-right">
            <div class="filter-input">
              <span class="filter-label">涨跌状态:</span>
              <el-select
                v-model="filterTrendStatus"
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
                v-model="filterStockCode"
                placeholder="输入股票代码筛选"
                clearable
                style="width: 180px"
              />
            </div>
            <span v-if="responseData" class="result-stats">
              共 {{ filteredTotal }} 只股票
            </span>
          </div>
        </div>
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
              v-loading="loading || isLoadingAll"
              @row-click="handleRowClick"
              :row-class-name="getRowClassName"
            >
              <el-table-column prop="stock_code" label="股票代码" min-width="100" sortable />
              <el-table-column prop="stock_name" label="股票名称" min-width="120" sortable />
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { fetchTradeDateQuery } from '@/api/stock'
import type { TradeDateQueryResponse, TradeDateQueryItem } from '@/types/tradeDateQuery'

const loading = ref(false)
const errorMessage = ref('')
const queryDate = ref('')
const responseData = ref<TradeDateQueryResponse | null>(null)

// 股票代码筛选
const filterStockCode = ref('')
// 涨跌状态筛选
const filterTrendStatus = ref('')
// 全量数据存储（用于筛选）
const allData = ref<TradeDateQueryItem[]>([])
// 全量数据加载状态
const isLoadingAll = ref(false)
// 当前选中的股票代码
const selectedStockCode = ref('')

// 初始化日期为今天
onMounted(() => {
  const today = new Date()
  queryDate.value = today.toISOString().split('T')[0] as string
})

// 加载全量数据（分批次请求，每次100条）
async function loadAllData() {
  if (!queryDate.value || !responseData.value) return

  const totalRecordsCount = responseData.value.total
  if (totalRecordsCount === 0) return

  isLoadingAll.value = true
  const batchSize = 100
  const totalPages = Math.ceil(totalRecordsCount / batchSize)
  const allResults: TradeDateQueryItem[] = []

  try {
    for (let page = 1; page <= totalPages; page++) {
      const res = await fetchTradeDateQuery({
        trade_date: queryDate.value,
        page: page,
        page_size: batchSize,
      })
      allResults.push(...res.data)
    }
    allData.value = allResults
  } catch (err) {
    console.error('Failed to fetch all data for filtering:', err)
  } finally {
    isLoadingAll.value = false
  }
}

// 监听股票代码筛选，当有筛选时请求全量数据
watch(filterStockCode, async (newStockCode) => {
  if (newStockCode.trim() && responseData.value && queryDate.value) {
    // 有筛选值时，请求全量数据（如果还没有加载过）
    if (allData.value.length === 0) {
      await loadAllData()
    }
  }
})

// 筛选后的数据（应用股票代码筛选）
const filteredData = computed(() => {
  // 始终使用全量数据作为数据源
  if (allData.value.length === 0) return []

  let data = allData.value

  // 根据股票代码筛选（支持模糊匹配）
  if (filterStockCode.value.trim()) {
    const keyword = filterStockCode.value.trim().toLowerCase()
    data = data.filter(item =>
      item.stock_code.toLowerCase().includes(keyword)
    )
  }

  return data
})

// 左表格数据（去重后的股票列表）
const leftTableData = computed(() => {
  const seen = new Set<string>()
  return filteredData.value.filter(item => {
    if (seen.has(item.stock_code)) return false
    seen.add(item.stock_code)
    return true
  })
})

// 右表格数据（选中股票的时间序列明细，应用涨跌状态筛选）
const rightTableData = computed(() => {
  if (!selectedStockCode.value) return []

  let data = allData.value
    .filter(item => item.stock_code === selectedStockCode.value)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // 根据涨跌状态筛选右边表格
  if (filterTrendStatus.value) {
    data = data.filter(item => {
      const trend = getPriceTrend(item)
      if (filterTrendStatus.value === 'up') {
        return trend.includes('上涨')
      } else if (filterTrendStatus.value === 'down') {
        return trend.includes('下跌')
      } else if (filterTrendStatus.value === 'flat') {
        return trend.includes('持平')
      }
      return true
    })
  }

  return data
})

// 筛选后的总股票数（去重后）
const filteredTotal = computed(() => {
  return leftTableData.value.length
})

// 查询处理
async function handleQuery() {
  if (!queryDate.value) {
    errorMessage.value = '请选择交易日期'
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    const res = await fetchTradeDateQuery({
      trade_date: queryDate.value,
      page: 1,
      page_size: 100,
    })

    responseData.value = res

    if (!res.data || res.data.length === 0) {
      errorMessage.value = '未查询到数据'
      allData.value = []
      selectedStockCode.value = ''
    } else {
      // 自动加载全量数据
      await loadAllData()

      // 加载完成后自动选中第一条
      if (leftTableData.value.length > 0) {
        selectedStockCode.value = leftTableData.value[0]?.stock_code || ''
      }
    }
  } catch (err: any) {
    errorMessage.value = err?.message || '查询失败'
    responseData.value = null
    allData.value = []
    selectedStockCode.value = ''
  } finally {
    loading.value = false
  }
}

// 初始查询（重置到第一页）
async function handleInitialQuery() {
  filterStockCode.value = '' // 清空股票代码筛选
  filterTrendStatus.value = '' // 清空涨跌状态筛选
  allData.value = [] // 清空全量数据缓存
  selectedStockCode.value = '' // 清空选中状态
  await handleQuery()
}

// 左表格行点击事件
function handleRowClick(row: TradeDateQueryItem) {
  selectedStockCode.value = row.stock_code
}

// 获取行的类名（用于高亮选中行）
function getRowClassName({ row }: { row: TradeDateQueryItem }) {
  return row.stock_code === selectedStockCode.value ? 'selected-row' : ''
}

// 格式化数字
function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// 格式化日期时间
function formatDateTime(value: string): string {
  if (!value) return '-'
  try {
    const date = new Date(value)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return value
  }
}

// 获取涨跌幅样式类
function getChangeClass(value: string | number): string {
  const num = Number(value)
  if (isNaN(num)) return ''
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return ''
}

// 计算涨跌状态
function getPriceTrend(row: TradeDateQueryItem): string {
  if (!row.close_price) return '→ 持平'

  const latestPrice = Number(row.latest_price)
  const closePrice = Number(row.close_price)

  if (isNaN(latestPrice) || isNaN(closePrice)) return '→ 持平'

  if (latestPrice > closePrice) return '↓ 下跌'
  if (latestPrice < closePrice) return '↑ 上涨'
  return '→ 持平'
}

// 获取涨跌状态样式类
function getPriceTrendClass(row: TradeDateQueryItem): string {
  const trend = getPriceTrend(row)
  if (trend.includes('上涨')) return 'trend-up'
  if (trend.includes('下跌')) return 'trend-down'
  return 'trend-flat'
}
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(to bottom, #f5f7fa 0%, #e8eaf0 100%);
}

.query-panel {
  flex-shrink: 0;
  flex-basis: auto;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: visible;
}

.query-panel :deep(.el-card__header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.query-panel :deep(.el-card__body) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0 0 4px 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
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

.query-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.date-picker {
  width: 200px;
}

.page-size-select {
  width: 140px;
}

.error-alert {
  margin-top: 12px;
}

.result-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
}

.result-panel :deep(.el-card__header) {
  flex-shrink: 0;
}

.result-panel :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
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

/* 响应式 */
@media (max-width: 768px) {
  .query-form {
    flex-direction: column;
    align-items: stretch;
  }

  .date-picker,
  .page-size-select {
    width: 100%;
  }
}
</style>

