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
          <div class="header-left">
            <span>价格对比分析</span>
            <span v-if="responseData" class="date-info">
              快照日期: {{ responseData.snapshot_date || '-' }} / 交易日期: {{ responseData.trade_date || '-' }}
            </span>
          </div>
          <div class="header-right">
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
              共 {{ filteredTotal }} 条，当前第 {{ currentPage }}/{{ totalPages }} 页
            </span>
          </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { fetchPriceCompare } from '@/api/stock'
import type { PriceCompareResponse, PriceCompareItem } from '@/types/priceCompare'

const loading = ref(false)
const errorMessage = ref('')
const queryDate = ref('')
const pageSize = ref(20)
const responseData = ref<PriceCompareResponse | null>(null)

// 前端分页相关
const currentPage = ref(1)
const currentPageSize = ref(20)

// 股票代码筛选
const filterStockCode = ref('')
const allData = ref<PriceCompareItem[]>([])
const isLoadingAll = ref(false)

// 初始化日期为明天（因为需要前一个交易日的数据）
onMounted(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  queryDate.value = tomorrow.toISOString().split('T')[0] as string
})

// 加载全量数据（分批次请求，每次100条）
async function loadAllData() {
  if (!queryDate.value || !responseData.value) return

  const totalRecordsCount = responseData.value.total
  if (totalRecordsCount === 0) return

  isLoadingAll.value = true
  const batchSize = 100
  const totalPages = Math.ceil(totalRecordsCount / batchSize)
  const allResults: PriceCompareItem[] = []

  try {
    for (let page = 1; page <= totalPages; page++) {
      const res = await fetchPriceCompare({
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

// 监听筛选输入，当有输入时请求全量数据
watch(filterStockCode, async (newVal) => {
  if (newVal.trim() && responseData.value && queryDate.value) {
    if (allData.value.length === 0) {
      await loadAllData()
    }
  }
})

// 筛选后的数据
const filteredData = computed(() => {
  if (!filterStockCode.value.trim()) {
    return responseData.value?.data || []
  }

  const dataSource = allData.value.length > 0 ? allData.value : (responseData.value?.data || [])
  const keyword = filterStockCode.value.trim().toLowerCase()
  return dataSource.filter(item =>
    item.stock_code.toLowerCase().includes(keyword)
  )
})

// 表格数据（应用筛选后的数据）
const tableData = computed(() => {
  return filteredData.value
})

// 筛选后的总记录数
const filteredTotal = computed(() => {
  if (!filterStockCode.value.trim()) {
    return responseData.value?.total || 0
  }
  return filteredData.value.length
})

// 总记录数（使用后端返回的 total）
const totalRecords = computed(() => {
  return responseData.value?.total || 0
})

// 总页数
const totalPages = computed(() => {
  return responseData.value?.total_pages || 0
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
    const res = await fetchPriceCompare({
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
  // 清空筛选和全量数据缓存
  filterStockCode.value = ''
  allData.value = []
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

// 数值格式化
function formatNumber(value: string | number): string {
  const num = Number(value)
  if (isNaN(num)) return '-'
  return num.toFixed(2)
}

// 日期时间格式化
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

// 盈利等级样式
function getGradeClass(grade: string): string {
  if (grade === 'A') return 'grade-a'
  if (grade === 'B') return 'grade-b'
  return 'grade-c'
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

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-info {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 4px 12px;
  border-radius: 4px;
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

