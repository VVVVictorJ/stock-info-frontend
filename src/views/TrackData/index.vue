<template>
  <div class="page-container">
    <QueryPanel
      v-model:query-date="queryDate"
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
      :right-table-data="rightTableData"
      v-model:filter-stock-code="filterStockCode"
      v-model:filter-trend-status="filterTrendStatus"
      v-model:filter-track-tag="filterTrackTag"
      v-model:selected-stock-code="selectedStockCode"
      v-model:selected-track-days="selectedTrackDays"
      :filtered-total="filteredTotal"
      :loading="loading || isLoadingDetail"
      :has-data="!!responseData"
      :query-date="queryDate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { fetchTrackQuery, fetchTrackDetail } from '@/api/stock'
import type { TrackQueryResponse, TrackQueryItem, TrackDetailItem } from '@/types/trackQuery'
import { getPriceTrend } from '@/utils/priceStyles'
import QueryPanel from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
const loading = ref(false)
const errorMessage = ref('')
const queryDate = ref('')
const responseData = ref<TrackQueryResponse | null>(null)
const isLoadingDetail = ref(false)

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
// 追踪标签筛选
const filterTrackTag = ref('')
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
const allData = ref<TrackQueryItem[]>([])
// 当前选中的股票代码
const selectedStockCode = ref('')
// 选中的追踪天数（用于明细查询）
const selectedTrackDays = ref(14)
// 选中股票的明细数据
const detailData = ref<TrackDetailItem[]>([])

// 初始化日期为今天
onMounted(() => {
  const today = new Date()
  queryDate.value = today.toISOString().split('T')[0] as string
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

  // 追踪标签筛选（14天≥3次，7天≥2次，3天≥2次）
  if (filterTrackTag.value) {
    data = data.filter(item => {
      if (filterTrackTag.value === 'days_14') {
        return item.occurrence_stats.days_14 >= 3
      } else if (filterTrackTag.value === 'days_7') {
        return item.occurrence_stats.days_7 >= 2
      } else if (filterTrackTag.value === 'days_3') {
        return item.occurrence_stats.days_3 >= 2
      }
      return true
    })
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

// 右表格数据（选中股票的时间序列明细，应用涨跌状态筛选）
const rightTableData = computed(() => {
  if (!selectedStockCode.value) return []

  let data = detailData.value

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

// 当选中股票或追踪天数变化时，加载明细数据
watch([selectedStockCode, selectedTrackDays], async ([newCode, _newDays]) => {
  if (!newCode) {
    detailData.value = []
    return
  }
  await loadDetailData(newCode as string)
})

// 加载选中股票的明细数据
async function loadDetailData(stockCode: string) {
  if (!stockCode || !queryDate.value) return

  isLoadingDetail.value = true
  try {
    const res = await fetchTrackDetail({
      stock_code: stockCode,
      trade_date: queryDate.value,
      track_days: selectedTrackDays.value,
    })
    detailData.value = res.data
  } catch (err) {
    console.error('Failed to fetch detail data:', err)
    detailData.value = []
  } finally {
    isLoadingDetail.value = false
  }
}

// 查询处理
async function handleQuery() {
  if (!queryDate.value) {
    errorMessage.value = '请选择交易日期'
    return
  }

  errorMessage.value = ''
  loading.value = true

  // 清空筛选条件
  filterStockCode.value = ''
  filterTrendStatus.value = ''
  filterTrackTag.value = ''
  filterPlates.value = []
  rangeFilters.value = {
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
  }
  selectedStockCode.value = ''
  detailData.value = []

  try {
    const res = await fetchTrackQuery({
      trade_date: queryDate.value,
      min_occurrences: 3,
    })

    responseData.value = res
    allData.value = res.data

    if (!res.data || res.data.length === 0) {
      errorMessage.value = '未查询到符合条件的股票（14天≥3次 或 7天≥2次 或 3天≥2次）'
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
