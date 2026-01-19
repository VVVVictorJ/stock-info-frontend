<template>
  <div class="page-container">
    <QueryPanel
      v-model:query-date="queryDate"
      v-model:filter-plates="filterPlates"
      v-model:range-filters="rangeFilters"
      :plate-options="plateOptions"
      :loading="loading"
      :error-message="errorMessage"
      @query="handleInitialQuery"
      @clear-error="errorMessage = ''"
    />
    <ResultPanel
      :left-table-data="leftTableData"
      :right-table-data="rightTableData"
      v-model:filter-stock-code="filterStockCode"
      v-model:filter-trend-status="filterTrendStatus"
      v-model:selected-stock-code="selectedStockCode"
      :filtered-total="filteredTotal"
      :loading="loading || isLoadingAll"
      :has-data="!!responseData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { fetchTradeDateQuery } from '@/api/stock'
import type { TradeDateQueryResponse, TradeDateQueryItem } from '@/types/tradeDateQuery'
import { getPriceTrend } from '@/utils/priceStyles'
import QueryPanel from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
const loading = ref(false)
const errorMessage = ref('')
const queryDate = ref('')
const responseData = ref<TradeDateQueryResponse | null>(null)

interface RangeFilters {
  changePctMin: number | null
  changePctMax: number | null
  volumeRatioMin: number | null
  volumeRatioMax: number | null
  turnoverRateMin: number | null
  turnoverRateMax: number | null
  bidAskRatioMin: number | null
  bidAskRatioMax: number | null
  mainForceInflowMin: number | null
  mainForceInflowMax: number | null
}

// 股票代码筛选
const filterStockCode = ref('')
// 涨跌状态筛选
const filterTrendStatus = ref('')
// 板块筛选（多选）
const filterPlates = ref<string[]>([])
// 区间筛选（仅左表）
const rangeFilters = reactive<RangeFilters>({
  changePctMin: null,
  changePctMax: null,
  volumeRatioMin: null,
  volumeRatioMax: null,
  turnoverRateMin: null,
  turnoverRateMax: null,
  bidAskRatioMin: null,
  bidAskRatioMax: null,
  mainForceInflowMin: null,
  mainForceInflowMax: null,
})
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

// 监听板块筛选，当有筛选时请求全量数据
watch(filterPlates, async (newPlates) => {
  if (newPlates.length > 0 && responseData.value && queryDate.value) {
    if (allData.value.length === 0) {
      await loadAllData()
    }
  }
})

// 监听区间筛选，当有筛选时请求全量数据
watch(
  rangeFilters,
  async (filters) => {
    const hasRangeFilter = Object.values(filters).some(value => value !== null && value !== undefined)
    if (hasRangeFilter && responseData.value && queryDate.value) {
      if (allData.value.length === 0) {
        await loadAllData()
      }
    }
  },
  { deep: true }
)

// 聚合板块选项（来自当前查询日期的全量数据）
const plateOptions = computed(() => {
  const plateMap = new Map<string, { plate_code: string; name: string }>()
  for (const item of allData.value) {
    if (!item.plates) continue
    for (const plate of item.plates) {
      if (!plate?.plate_code || !plate?.name) continue
      if (!plateMap.has(plate.plate_code)) {
        plateMap.set(plate.plate_code, plate)
      }
    }
  }
  return Array.from(plateMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

// 筛选后的数据（应用股票代码筛选）
const filteredData = computed(() => {
  // 始终使用全量数据作为数据源
  if (allData.value.length === 0) return []

  let data = allData.value

  const inRange = (value: string, min: number | null, max: number | null) => {
    const num = Number(value)
    if (Number.isNaN(num)) return false
    if (min !== null && num < min) return false
    if (max !== null && num > max) return false
    return true
  }

  // 区间筛选（仅左表）
  if (
    rangeFilters.changePctMin !== null || rangeFilters.changePctMax !== null ||
    rangeFilters.volumeRatioMin !== null || rangeFilters.volumeRatioMax !== null ||
    rangeFilters.turnoverRateMin !== null || rangeFilters.turnoverRateMax !== null ||
    rangeFilters.bidAskRatioMin !== null || rangeFilters.bidAskRatioMax !== null ||
    rangeFilters.mainForceInflowMin !== null || rangeFilters.mainForceInflowMax !== null
  ) {
    data = data.filter(item =>
      inRange(item.change_pct, rangeFilters.changePctMin, rangeFilters.changePctMax) &&
      inRange(item.volume_ratio, rangeFilters.volumeRatioMin, rangeFilters.volumeRatioMax) &&
      inRange(item.turnover_rate, rangeFilters.turnoverRateMin, rangeFilters.turnoverRateMax) &&
      inRange(item.bid_ask_ratio, rangeFilters.bidAskRatioMin, rangeFilters.bidAskRatioMax) &&
      inRange(item.main_force_inflow, rangeFilters.mainForceInflowMin, rangeFilters.mainForceInflowMax)
    )
  }

  // 根据板块筛选（匹配任一板块）
  if (filterPlates.value.length > 0) {
    const selected = new Set(filterPlates.value)
    data = data.filter(item =>
      (item.plates || []).some(plate => selected.has(plate.plate_code))
    )
  }

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

// 当左侧筛选结果变化时，保持选中项有效
watch(leftTableData, (data) => {
  if (!selectedStockCode.value) {
    if (data.length > 0) {
      selectedStockCode.value = data[0]?.stock_code || ''
    }
    return
  }
  const exists = data.some(item => item.stock_code === selectedStockCode.value)
  if (!exists) {
    selectedStockCode.value = data[0]?.stock_code || ''
  }
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
  filterPlates.value = [] // 清空板块筛选
  rangeFilters.changePctMin = null
  rangeFilters.changePctMax = null
  rangeFilters.volumeRatioMin = null
  rangeFilters.volumeRatioMax = null
  rangeFilters.turnoverRateMin = null
  rangeFilters.turnoverRateMax = null
  rangeFilters.bidAskRatioMin = null
  rangeFilters.bidAskRatioMax = null
  rangeFilters.mainForceInflowMin = null
  rangeFilters.mainForceInflowMax = null
  allData.value = [] // 清空全量数据缓存
  selectedStockCode.value = '' // 清空选中状态
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
