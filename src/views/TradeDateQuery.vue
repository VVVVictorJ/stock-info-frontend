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
        <el-select v-model="pageSize" placeholder="每页条数" class="page-size-select">
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
          <el-option label="100条/页" :value="100" />
        </el-select>
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
          <span v-if="responseData" class="result-stats">
            共 {{ responseData.total }} 条，当前第 {{ responseData.page }}/{{ responseData.total_pages }} 页
          </span>
        </div>
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
        </div>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="currentPageSize"
            :page-sizes="[20, 50, 100]"
            :total="totalRecords"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { fetchTradeDateQuery } from '@/api/stock'
import type { TradeDateQueryResponse, TradeDateQueryItem } from '@/types/tradeDateQuery'

const loading = ref(false)
const errorMessage = ref('')
const queryDate = ref('')
const pageSize = ref(20)
const responseData = ref<TradeDateQueryResponse | null>(null)

// 前端分页相关
const currentPage = ref(1)
const currentPageSize = ref(20)

// 初始化日期为今天
onMounted(() => {
  const today = new Date()
  queryDate.value = today.toISOString().split('T')[0] as string
})

// 表格数据（后端分页，直接显示）
const tableData = computed(() => {
  if (!responseData.value || !responseData.value.data) return []
  return responseData.value.data
})

// 总记录数（使用后端返回的 total）
const totalRecords = computed(() => {
  return responseData.value?.total || 0
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
      page: currentPage.value,
      page_size: currentPageSize.value,
    })

    responseData.value = res

    if (!res.data || res.data.length === 0) {
      errorMessage.value = '未查询到数据'
    }
  } catch (err: any) {
    errorMessage.value = err?.message || '查询失败'
    responseData.value = null
  } finally {
    loading.value = false
  }
}

// 初始查询（重置到第一页）
async function handleInitialQuery() {
  currentPage.value = 1
  currentPageSize.value = pageSize.value
  await handleQuery()
}

// 分页处理（重新请求后端数据）
async function handleSizeChange(size: number) {
  currentPageSize.value = size
  currentPage.value = 1
  await handleQuery()
}

async function handleCurrentChange(page: number) {
  currentPage.value = page
  await handleQuery()
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

.result-stats {
  font-size: 14px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
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

.pagination-container {
  flex-shrink: 0;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  background: white;
  z-index: 10;
}

/* 表格样式 */
.table-container :deep(.el-table) {
  flex: 1;
  max-height: 100%;
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

