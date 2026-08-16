<template>
  <div class="page-container">
    <QueryPanel
      v-model:stock-code="stockCode"
      v-model:stock-name="stockName"
      v-model:plate-code="plateCode"
      :plate-options="plateOptions"
      :loading="loading"
      :error-message="errorMessage"
      @query="handleQuery"
      @clear-error="errorMessage = ''"
    />
    <ResultPanel
      :left-table-data="leftTableData"
      :right-table-data="rightTableData"
      v-model:selected-stock-code="selectedStockCode"
      :filtered-total="filteredTotal"
      :loading="loading || isLoadingAll"
      :has-data="!!responseData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { fetchStockAppearanceQuery, fetchStockPlatesList } from '@/api/stock'
import type {
  StockAppearanceQueryItem,
  StockAppearanceQueryRequest,
  StockAppearanceQueryResponse,
} from '@/types/stockAppearanceQuery'
import type { StockPlateListItem } from '@/types/stockPlate'
import QueryPanel from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
const loading = ref(false)
const errorMessage = ref('')
const responseData = ref<StockAppearanceQueryResponse | null>(null)

// 查询条件
const stockCode = ref('')
const stockName = ref('')
const plateCode = ref('')
const plateOptions = ref<StockPlateListItem[]>([])

// 全量数据与加载状态
const allData = ref<StockAppearanceQueryItem[]>([])
const isLoadingAll = ref(false)
// 当前选中的股票代码
const selectedStockCode = ref('')

// 加载板块字典
onMounted(async () => {
  try {
    const list = await fetchStockPlatesList()
    plateOptions.value = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
  } catch (err) {
    console.error('Failed to fetch plate list:', err)
  }
})

// 构造查询参数（仅携带已填写的条件）
function buildParams(page: number, pageSize: number): StockAppearanceQueryRequest {
  const params: StockAppearanceQueryRequest = { page, page_size: pageSize }
  const code = (stockCode.value ?? '').trim()
  const name = (stockName.value ?? '').trim()
  const plate = (plateCode.value ?? '').trim()
  if (code) params.stock_code = code
  if (name) params.stock_name = name
  if (plate) params.plate_code = plate
  return params
}

// 加载全量数据（分批次请求，每次100条）
async function loadAllData(totalRecordsCount: number) {
  if (totalRecordsCount === 0) return

  isLoadingAll.value = true
  const batchSize = 100
  const totalPages = Math.ceil(totalRecordsCount / batchSize)
  const allResults: StockAppearanceQueryItem[] = []

  try {
    for (let page = 1; page <= totalPages; page++) {
      const res = await fetchStockAppearanceQuery(buildParams(page, batchSize))
      allResults.push(...res.data)
    }
    allData.value = allResults
  } catch (err) {
    console.error('Failed to fetch all appearance data:', err)
  } finally {
    isLoadingAll.value = false
  }
}

// 左表格数据（去重后的股票列表，按最近出现时间从新到旧）
const leftTableData = computed(() => {
  const seen = new Set<string>()
  return [...allData.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter(item => {
      if (seen.has(item.stock_code)) return false
      seen.add(item.stock_code)
      return true
    })
})

// 右表格数据（选中股票的历史出现记录，按创建时间从新到旧）
const rightTableData = computed(() => {
  if (!selectedStockCode.value) return []
  return allData.value
    .filter(item => item.stock_code === selectedStockCode.value)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
  // el-select 清空时会 emit undefined，统一归一化为空字符串
  if (!(stockCode.value ?? '').trim() && !(stockName.value ?? '').trim() && !(plateCode.value ?? '').trim()) {
    errorMessage.value = '请至少填写一个查询条件'
    return
  }

  errorMessage.value = ''
  loading.value = true
  allData.value = []
  selectedStockCode.value = ''

  try {
    const res = await fetchStockAppearanceQuery(buildParams(1, 100))
    responseData.value = res

    if (!res.data || res.data.length === 0) {
      errorMessage.value = '未查询到数据'
    } else {
      // 自动加载全量数据
      await loadAllData(res.total)

      // 加载完成后自动选中第一条
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
