<template>
  <div class="page-container">
    <QueryPanel
      v-model:selected-stock-code="selectedStockCode"
      v-model:selected-history-id="selectedHistoryId"
      :stock-options="stockOptions"
      :history-options="historyOptions"
      :loading="loading"
      :error-message="errorMessage"
      @analyze="handleAnalyze"
      @load-detail="handleLoadDetail"
      @clear-error="errorMessage = ''"
    />
    <ResultPanel
      :result="analysisResult"
      :loading="loading"
      :has-data="!!analysisResult"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { listWatchlist } from '@/api/stock'
import { fetchTrendPrediction, fetchTrendHistory, fetchTrendDetail } from '@/api/aiAnalysis'
import type {
  TrendPredictionResponse,
  TrendHistoryItem,
} from '@/types/aiAnalysis'
import QueryPanel from './QueryPanel.vue'
import ResultPanel from './ResultPanel.vue'

// 核心状态
const loading = ref(false)
const errorMessage = ref('')
const analysisResult = ref<TrendPredictionResponse | null>(null)

// 股票选项
const stockOptions = ref<Array<{ stock_code: string; stock_name: string | null }>>([])
const selectedStockCode = ref('')

// 历史记录
const historyOptions = ref<TrendHistoryItem[]>([])
const selectedHistoryId = ref<number | null>(null)

// 加载观察表股票列表
async function loadStockOptions() {
  try {
    const res = await listWatchlist()
    stockOptions.value = (res as any[]).map((item: any) => ({
      stock_code: item.stock_code,
      stock_name: item.stock_name || null,
    }))
    // 默认选中第一个
    if (stockOptions.value.length > 0 && !selectedStockCode.value) {
      selectedStockCode.value = stockOptions.value[0].stock_code
    }
  } catch (err) {
    console.error('Failed to load watchlist:', err)
  }
}

// 加载历史记录
async function loadHistory(stockCode?: string) {
  try {
    const res = await fetchTrendHistory({
      stock_code: stockCode || undefined,
      page_size: 50,
      page: 1,
    })
    historyOptions.value = res.data
  } catch (err) {
    console.error('Failed to load history:', err)
  }
}

// 当股票代码变更时，刷新历史记录
watch(selectedStockCode, (newCode) => {
  if (newCode) {
    loadHistory(newCode)
    selectedHistoryId.value = null
    analysisResult.value = null
  }
})

// 发起分析
async function handleAnalyze() {
  if (!selectedStockCode.value) {
    errorMessage.value = '请先选择一只股票'
    return
  }

  errorMessage.value = ''
  loading.value = true
  analysisResult.value = null

  try {
    const res = await fetchTrendPrediction({
      stock_code: selectedStockCode.value,
    })
    analysisResult.value = res
    // 刷新历史记录
    await loadHistory(selectedStockCode.value)
  } catch (err: any) {
    errorMessage.value = err?.message || 'AI分析请求失败'
  } finally {
    loading.value = false
  }
}

// 加载历史详情
async function handleLoadDetail(id: number) {
  errorMessage.value = ''
  loading.value = true

  try {
    const res = await fetchTrendDetail(id)
    analysisResult.value = res
  } catch (err: any) {
    errorMessage.value = err?.message || '加载分析详情失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStockOptions()
  loadHistory()
})
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
