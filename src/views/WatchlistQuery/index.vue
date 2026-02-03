<template>
  <div class="page-container">
    <QueryPanel
      v-model:filter-plates="filterPlates"
      v-model:range-filters="rangeFilters"
      :plate-options="plateOptions"
      :loading="loading"
      :error-message="errorMessage"
      @query="handleQuery"
      @clear-error="errorMessage = ''"
    />
    <ResultPanel
      :left-table-data="leftTableData"
      :middle-table-data="middleTableData"
      :right-table-data="rightTableData"
      v-model:filter-stock-code="filterStockCode"
      v-model:selected-stock-code="selectedStockCode"
      :filtered-total="filteredTotal"
      :loading="loading"
      :loading-detail="isLoadingDetail"
      :loading-kline="isLoadingKline"
      :has-data="!!responseData"
      :kline-start-date="klineStartDate"
      :kline-end-date="klineEndDate"
      @refresh="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { fetchWatchlistQuery, fetchWatchlistDetail, fetchWatchlistKline } from '@/api/stock'
import type {
  WatchlistQueryResponse,
  WatchlistQueryItem,
  WatchlistDetailItem,
  WatchlistKlineItem,
} from '@/types/watchlistQuery'
import QueryPanel from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
const loading = ref(false)
const errorMessage = ref('')
const responseData = ref<WatchlistQueryResponse | null>(null)
const isLoadingDetail = ref(false)
const isLoadingKline = ref(false)

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
// 板块筛选（多选）
const filterPlates = ref<string[]>([])
// 区间筛选
const rangeFilters = ref<RangeFilters>({
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
const allData = ref<WatchlistQueryItem[]>([])
// 当前选中的股票代码
const selectedStockCode = ref('')
// 选中股票的明细数据
const detailData = ref<WatchlistDetailItem[]>([])
// 选中股票的K线数据
const klineData = ref<WatchlistKlineItem[]>([])
// K线日期范围
const klineStartDate = ref<string | null>(null)
const klineEndDate = ref<string | null>(null)

// 初始化时自动查询
onMounted(() => {
  handleQuery()
})

// 聚合板块选项（来自当前查询的全量数据）
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

// 筛选后的数据
const filteredData = computed(() => {
  if (allData.value.length === 0) return []

  let data = allData.value
  const filters = rangeFilters.value

  const inRange = (value: string, min: number | null, max: number | null) => {
    const num = Number(value)
    if (Number.isNaN(num)) return false
    if (min !== null && num < min) return false
    if (max !== null && num > max) return false
    return true
  }

  // 区间筛选
  if (
    filters.changePctMin !== null || filters.changePctMax !== null ||
    filters.volumeRatioMin !== null || filters.volumeRatioMax !== null ||
    filters.turnoverRateMin !== null || filters.turnoverRateMax !== null ||
    filters.bidAskRatioMin !== null || filters.bidAskRatioMax !== null ||
    filters.mainForceInflowMin !== null || filters.mainForceInflowMax !== null
  ) {
    data = data.filter(item =>
      inRange(item.change_pct, filters.changePctMin, filters.changePctMax) &&
      inRange(item.volume_ratio, filters.volumeRatioMin, filters.volumeRatioMax) &&
      inRange(item.turnover_rate, filters.turnoverRateMin, filters.turnoverRateMax) &&
      inRange(item.bid_ask_ratio, filters.bidAskRatioMin, filters.bidAskRatioMax) &&
      inRange(item.main_force_inflow, filters.mainForceInflowMin, filters.mainForceInflowMax)
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

// 中间表格数据（选中股票的时间序列明细）
const middleTableData = computed(() => {
  if (!selectedStockCode.value) return []
  return detailData.value
})

// 右表格数据（选中股票的K线数据）
const rightTableData = computed(() => {
  if (!selectedStockCode.value) return []
  return klineData.value
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

// 当选中股票变化时，加载明细和K线数据
watch(selectedStockCode, async (newCode) => {
  if (!newCode) {
    detailData.value = []
    klineData.value = []
    klineStartDate.value = null
    klineEndDate.value = null
    return
  }
  await Promise.all([
    loadDetailData(newCode),
    loadKlineData(newCode),
  ])
})

// 加载选中股票的明细数据
async function loadDetailData(stockCode: string) {
  if (!stockCode) return

  isLoadingDetail.value = true
  try {
    const res = await fetchWatchlistDetail({
      stock_code: stockCode,
    })
    detailData.value = res.data
  } catch (err) {
    console.error('Failed to fetch detail data:', err)
    detailData.value = []
  } finally {
    isLoadingDetail.value = false
  }
}

// 加载选中股票的K线数据
async function loadKlineData(stockCode: string) {
  if (!stockCode) return

  isLoadingKline.value = true
  try {
    const res = await fetchWatchlistKline({
      stock_code: stockCode,
    })
    klineData.value = res.data
    klineStartDate.value = res.start_date
    klineEndDate.value = res.end_date
  } catch (err) {
    console.error('Failed to fetch kline data:', err)
    klineData.value = []
    klineStartDate.value = null
    klineEndDate.value = null
  } finally {
    isLoadingKline.value = false
  }
}

// 刷新处理（补齐K线数据后调用）
async function handleRefresh() {
  // 如果当前有选中的股票，刷新该股票的K线数据
  if (selectedStockCode.value) {
    await loadKlineData(selectedStockCode.value)
  }
}

// 查询处理
async function handleQuery() {
  errorMessage.value = ''
  loading.value = true

  // 清空选中状态和详情数据
  selectedStockCode.value = ''
  detailData.value = []
  klineData.value = []
  klineStartDate.value = null
  klineEndDate.value = null

  try {
    // 构建查询参数（使用当前的筛选条件）
    const params: any = {}
    if (filterPlates.value.length > 0) {
      params.plate_codes = filterPlates.value
    }
    if (rangeFilters.value.changePctMin !== null) {
      params.change_pct_min = rangeFilters.value.changePctMin
    }
    if (rangeFilters.value.changePctMax !== null) {
      params.change_pct_max = rangeFilters.value.changePctMax
    }
    if (rangeFilters.value.volumeRatioMin !== null) {
      params.volume_ratio_min = rangeFilters.value.volumeRatioMin
    }
    if (rangeFilters.value.volumeRatioMax !== null) {
      params.volume_ratio_max = rangeFilters.value.volumeRatioMax
    }
    if (rangeFilters.value.turnoverRateMin !== null) {
      params.turnover_rate_min = rangeFilters.value.turnoverRateMin
    }
    if (rangeFilters.value.turnoverRateMax !== null) {
      params.turnover_rate_max = rangeFilters.value.turnoverRateMax
    }
    if (rangeFilters.value.bidAskRatioMin !== null) {
      params.bid_ask_ratio_min = rangeFilters.value.bidAskRatioMin
    }
    if (rangeFilters.value.bidAskRatioMax !== null) {
      params.bid_ask_ratio_max = rangeFilters.value.bidAskRatioMax
    }
    if (rangeFilters.value.mainForceInflowMin !== null) {
      params.main_force_inflow_min = rangeFilters.value.mainForceInflowMin
    }
    if (rangeFilters.value.mainForceInflowMax !== null) {
      params.main_force_inflow_max = rangeFilters.value.mainForceInflowMax
    }
    if (filterStockCode.value.trim()) {
      params.stock_code_filter = filterStockCode.value.trim()
    }

    const res = await fetchWatchlistQuery(params)

    responseData.value = res
    allData.value = res.data

    if (!res.data || res.data.length === 0) {
      errorMessage.value = '未查询到符合条件的股票'
      allData.value = []
    } else {
      // 自动选中第一条
      if (leftTableData.value.length > 0) {
        selectedStockCode.value = leftTableData.value[0]?.stock_code || ''
      }
    }
  } catch (err: any) {
    errorMessage.value = err?.message || '查询失败'
    responseData.value = null
    allData.value = []
  } finally {
    loading.value = false
  }
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
