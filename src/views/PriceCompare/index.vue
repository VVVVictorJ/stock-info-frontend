<template>
  <div class="page-container">
    <QueryPanel
      v-model:query-date="queryDate"
      v-model:page-size="pageSize"
      :loading="loading"
      :error-message="errorMessage"
      @query="handleInitialQuery"
      @clear-error="errorMessage = ''"
    />
    <ResultPanel
      :response-data="responseData"
      :table-data="tableData"
      v-model:filter-stock-code="filterStockCode"
      :filtered-total="filteredTotal"
      :current-page="currentPage"
      :current-page-size="currentPageSize"
      :total-pages="totalPages"
      :total-records="totalRecords"
      :loading="loading"
      @update:current-page="currentPage = $event"
      @update:current-page-size="currentPageSize = $event"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { fetchPriceCompare } from '@/api/stock'
import type { PriceCompareResponse, PriceCompareItem } from '@/types/priceCompare'
import QueryPanel from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
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
  const totalPagesCount = Math.ceil(totalRecordsCount / batchSize)
  const allResults: PriceCompareItem[] = []

  try {
    for (let page = 1; page <= totalPagesCount; page++) {
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
</style>
