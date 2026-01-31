<template>
  <div class="page-container">
    <QueryPanel
      v-model:query-date="queryDate"
      v-model:filter-plates="filterPlates"
      :plate-options="plateOptions"
      v-model:trade-days="tradeDays"
      v-model:min-occurrences="minOccurrences"
      :loading="loading"
      :error-message="errorMessage"
      @query="handleQuery"
      @clear-error="errorMessage = ''"
    />
    <ResultPanel
      :left-table-data="leftTableData"
      :right-table-data="rightTableData"
      v-model:filter-stock-code="filterStockCode"
      v-model:selected-stock-code="selectedStockCode"
      :filtered-total="filteredTotal"
      :loading="loading || isLoadingDetail"
      :has-data="!!responseData && responseData.length > 0"
      :query-date="queryDate"
      :trade-days="tradeDays"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { fetchDynamicBacktrack, fetchDynamicBacktrackDetail } from '@/api/stock'
import type { DynamicBacktrackResponse, DynamicBacktrackItem } from '@/types/dynamicBacktrack'
import type { TrackDetailItem } from '@/types/trackQuery'
import QueryPanel from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
const loading = ref(false)
const errorMessage = ref('')
const queryDate = ref('')
const tradeDays = ref(7)
const minOccurrences = ref(2)
const responseData = ref<DynamicBacktrackResponse | null>(null)
const isLoadingDetail = ref(false)

// 股票代码筛选
const filterStockCode = ref('')
// 板块筛选（多选）
const filterPlates = ref<string[]>([])
// 全量数据存储（用于筛选）
const allData = ref<DynamicBacktrackItem[]>([])
// 当前选中的股票代码
const selectedStockCode = ref('')
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

// 右表格数据（选中股票的时间序列明细）
const rightTableData = computed(() => {
  if (!selectedStockCode.value) return []
  return detailData.value
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

// 当选中股票变化时，加载明细数据
watch([selectedStockCode, queryDate, tradeDays], async ([newCode, _newDate, _newDays]) => {
  if (!newCode) {
    detailData.value = []
    return
  }
  await loadDetailData(newCode as string)
})

// 加载选中股票的明细数据（使用动态天数）
async function loadDetailData(stockCode: string) {
  if (!stockCode || !queryDate.value) return

  isLoadingDetail.value = true
  try {
    const res = await fetchDynamicBacktrackDetail({
      stock_code: stockCode,
      trade_date: queryDate.value,
      trade_days: tradeDays.value,
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

  if (tradeDays.value < 1) {
    errorMessage.value = '交易日数必须大于0'
    return
  }

  if (minOccurrences.value < 1) {
    errorMessage.value = '最少出现次数必须大于0'
    return
  }

  errorMessage.value = ''
  loading.value = true

  // 清空筛选条件
  filterStockCode.value = ''
  filterPlates.value = []
  selectedStockCode.value = ''
  detailData.value = []

  try {
    const res = await fetchDynamicBacktrack({
      trade_date: queryDate.value,
      trade_days: tradeDays.value,
      min_occurrences: minOccurrences.value,
    })

    responseData.value = res
    allData.value = res.data

    if (!res.data || res.data.length === 0) {
      errorMessage.value = `未查询到符合条件的股票（${tradeDays.value}个交易日内出现${minOccurrences.value}次及以上）`
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
