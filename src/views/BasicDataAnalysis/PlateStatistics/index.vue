<template>
  <div class="page-container plate-statistics-page">
    <QueryCard title="板块数据统计" :error-message="errorMessage" :closable="true" @clear-error="errorMessage = ''">
      <div class="query-row">
        <el-date-picker
          v-model="queryDate"
          type="date"
          placeholder="选择统计日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />
        <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
      </div>
    </QueryCard>

    <ResultCard title="统计结果" class="statistics-card">
      <template #header-info>
        <span v-if="responseData" class="summary-text">
          日期：{{ responseData.trade_date }}；快照股票数：{{ responseData.total_stock_count }}；
          已匹配股票数：{{ responseData.classified_stock_count }}；未归属股票数：{{
            responseData.unclassified_count
          }}；板块数：{{ responseData.plate_count }}
        </span>
      </template>

      <div class="chart-panel" v-loading="loading">
        <div v-show="hasChartData" ref="chartRef" class="chart-container"></div>
        <el-empty v-if="!loading && !hasChartData" description="请选择有快照数据的日期后查询" class="empty-placeholder" />
      </div>

      <div class="tables-grid">
        <div class="table-panel">
          <div class="table-title">板块统计</div>
          <el-table
            :data="tableData"
            border
            stripe
            height="100%"
            row-key="plate_code"
            :current-row-key="selectedPlateCode"
            highlight-current-row
            class="statistics-table"
            @current-change="handlePlateCurrentChange"
            @row-click="handlePlateRowClick"
          >
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="plate_name" label="板块名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="plate_code" label="板块代码" min-width="110" />
            <el-table-column prop="stock_count" label="股票数" min-width="100" sortable />
          </el-table>
        </div>

        <div class="table-panel">
          <div class="table-title">
            板块股票
            <span v-if="selectedPlate" class="table-subtitle">（{{ selectedPlate.plate_name }}）</span>
          </div>
          <el-table :data="selectedStocks" border stripe height="100%" class="statistics-table">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="stock_code" label="股票代码" min-width="120" />
            <el-table-column prop="stock_name" label="股票名称" min-width="140" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </ResultCard>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { init, use, type ECharts, type EChartsCoreOption } from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import QueryCard from '@/component/common/QueryCard.vue'
import ResultCard from '@/component/common/ResultCard.vue'
import { fetchPlateStatistics } from '@/api/stock'
import type { PlateStatisticsItem, PlateStatisticsResponse } from '@/types/basicDataAnalysis'

use([TreemapChart, TooltipComponent, CanvasRenderer])

type ChartNode = {
  id: string
  name: string
  value: number
  plateCode: string
}

const loading = ref(false)
const errorMessage = ref('')
const queryDate = ref(formatDate(new Date()))
const responseData = ref<PlateStatisticsResponse | null>(null)
const selectedPlateCode = ref('')
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: ECharts | null = null

const tableData = computed<PlateStatisticsItem[]>(() =>
  (responseData.value?.data ?? []).map((item) => ({
    ...item,
    stocks: item.stocks ?? [],
  }))
)
const selectedPlate = computed(() => tableData.value.find((item) => item.plate_code === selectedPlateCode.value) ?? null)
const selectedStocks = computed(() => selectedPlate.value?.stocks ?? [])
const hasChartData = computed(() => chartNodes.value.length > 0)

const chartNodes = computed<ChartNode[]>(() =>
  tableData.value
    .map((item) => ({
      id: item.plate_code,
      name: item.plate_name,
      value: item.stock_count,
      plateCode: item.plate_code,
    }))
    .sort((a, b) => b.value - a.value)
)

onMounted(async () => {
  window.addEventListener('resize', resizeChart)
  await handleQuery()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
  chartInstance = null
})

async function handleQuery() {
  if (!queryDate.value) {
    ElMessage.warning('请先选择统计日期')
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    responseData.value = await fetchPlateStatistics({ trade_date: queryDate.value })
    selectedPlateCode.value = responseData.value.data[0]?.plate_code ?? ''
    await nextTick()
    renderChart()
    if (!hasChartData.value) {
      ElMessage.info('该日期暂无可统计的板块数据')
    }
  } catch (err: any) {
    errorMessage.value = err?.message ?? '查询板块统计失败'
  } finally {
    loading.value = false
  }
}

function handlePlateRowClick(row: PlateStatisticsItem) {
  selectedPlateCode.value = row.plate_code
}

function handlePlateCurrentChange(row?: PlateStatisticsItem) {
  if (!row) return
  selectedPlateCode.value = row.plate_code
}

function renderChart() {
  if (!chartRef.value || !hasChartData.value) return

  if (!chartInstance) {
    chartInstance = init(chartRef.value)
  }

  try {
    chartInstance.setOption(buildChartOption(), {
      notMerge: false,
      lazyUpdate: false,
    })
  } catch (err: any) {
    throw err
  }
  chartInstance.off('click')
  chartInstance.on('click', (params) => {
    const data = params.data as ChartNode | undefined
    if (data?.plateCode) {
      selectedPlateCode.value = data.plateCode
    }
  })
}

function buildChartOption(): EChartsCoreOption {
  const children = chartNodes.value
  const total = children.reduce((sum, item) => sum + item.value, 0)

  return {
    tooltip: {
      formatter: (params: any) => {
        const data = params.data as ChartNode
        const percent = total > 0 ? ((data.value / total) * 100).toFixed(2) : '0.00'
        return `${data.name}<br/>股票数：${data.value}<br/>占比：${percent}%`
      },
    },
    series: [
      {
        id: 'plate-statistics',
        type: 'treemap',
        name: '板块统计',
        data: children,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        animationDurationUpdate: 700,
        universalTransition: true,
        label: {
          formatter: '{b}\n{@value}只',
          overflow: 'truncate',
        },
        upperLabel: {
          show: false,
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 2,
              gapWidth: 2,
            },
          },
        ],
      },
    ],
  }
}

function resizeChart() {
  chartInstance?.resize()
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style scoped>
.plate-statistics-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.query-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.date-picker {
  width: 180px;
}

.statistics-card {
  min-height: 0;
}

.statistics-card :deep(.el-card__body) {
  overflow-y: auto;
  display: block;
}

.summary-text {
  color: #606266;
  font-size: 13px;
  font-weight: 400;
}

.chart-panel {
  height: 680px;
  min-height: 680px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.empty-placeholder {
  height: 100%;
}

.tables-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
  min-height: 460px;
}

.table-panel {
  min-height: 460px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-title {
  flex-shrink: 0;
  margin-bottom: 8px;
  color: #303133;
  font-weight: 600;
}

.table-subtitle {
  color: #606266;
  font-weight: 400;
}

.statistics-table {
  min-height: 0;
}

@media (max-width: 1200px) {
  .chart-panel {
    height: 560px;
    min-height: 560px;
  }

  .tables-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 360px 360px;
  }
}
</style>
