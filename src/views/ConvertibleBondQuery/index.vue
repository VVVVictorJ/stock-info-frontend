<template>
  <div class="page-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>可转债筛选查询</span>
          <div class="header-actions">
            <el-button class="download-button" title="下载当前结果" :icon="Download" @click="handleDownload" />
            <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          </div>
        </div>
      </template>

      <ErrorAlert :message="errorMessage" />

      <el-table v-if="tableData.length" :data="tableData" border stripe size="small" @sort-change="handleSortChange">
        <el-table-column prop="bond_code" label="债券代码" min-width="110" />
        <el-table-column prop="bond_short_name" label="债券简称" min-width="120" />
        <el-table-column prop="stock_code" label="正股代码" min-width="110" />
        <el-table-column prop="stock_name" label="正股名称" min-width="120" />
        <el-table-column prop="issue_scale" label="发行规模(亿)" min-width="120">
          <template #default="{ row }">
            {{ formatNumber(row.issue_scale) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="transfer_premium_ratio"
          label="转股溢价率(%)"
          min-width="130"
          sortable="custom"
          :sort-orders="['descending', 'ascending', null]"
        >
          <template #default="{ row }">
            {{ formatNumber(row.transfer_premium_ratio) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="stock_price"
          label="正股价格"
          min-width="100"
          sortable="custom"
          :sort-orders="['descending', 'ascending', null]"
        >
          <template #default="{ row }">
            {{ formatNullableNumber(row.stock_price) }}
          </template>
        </el-table-column>
        <el-table-column prop="bond_price" label="债券现价" min-width="100">
          <template #default="{ row }">
            {{ formatNullableNumber(row.bond_price) }}
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="placeholder">
        {{ loading ? '正在查询中...' : '点击查询获取符合固定规则的可转债数据' }}
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Sort } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import ErrorAlert from '@/component/common/ErrorAlert.vue'
import { fetchConvertibleBondQuery } from '@/api/stock'
import type { ConvertibleBondItem, ConvertibleBondQueryResponse } from '@/types/convertibleBondQuery'
import { exportToXlsx } from '@/utils/exportExcel'

const loading = ref(false)
const errorMessage = ref('')
const responseData = ref<ConvertibleBondQueryResponse | null>(null)
type SortField = 'transfer_premium_ratio' | 'stock_price'
type SortOrder = 'ascending' | 'descending' | null
const sortState = ref<{ prop: SortField | ''; order: SortOrder }>({ prop: '', order: null })

const tableData = computed<ConvertibleBondItem[]>(() => {
  const source = responseData.value?.data ?? []
  const { prop, order } = sortState.value
  if (!prop || !order) {
    return source
  }

  const sorted = [...source].sort((a, b) => {
    const av = a[prop]
    const bv = b[prop]
    const na = typeof av === 'number' ? av : Number.NEGATIVE_INFINITY
    const nb = typeof bv === 'number' ? bv : Number.NEGATIVE_INFINITY
    return order === 'descending' ? nb - na : na - nb
  })
  return sorted
})

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '-'
}

function formatNullableNumber(value: number | null): string {
  if (value === null || value === undefined) {
    return '-'
  }
  return formatNumber(value)
}

function handleSortChange({ prop, order }: { prop: string; order: Sort['order'] | null }) {
  if (prop === 'transfer_premium_ratio' || prop === 'stock_price') {
    sortState.value = { prop, order: order as SortOrder }
    return
  }
  sortState.value = { prop: '', order: null }
}

async function handleQuery() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetchConvertibleBondQuery()
    responseData.value = res
  } catch (err: any) {
    responseData.value = null
    errorMessage.value = err?.message ?? '查询失败'
  } finally {
    loading.value = false
  }
}

function handleDownload() {
  if (tableData.value.length === 0) {
    ElMessage.warning('当前无可导出数据')
    return
  }

  const now = new Date()
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  exportToXlsx({
    data: tableData.value.map(item => ({
      bond_code: item.bond_code,
      bond_short_name: item.bond_short_name,
      stock_code: item.stock_code,
      stock_name: item.stock_name,
      issue_scale: formatNumber(item.issue_scale),
      transfer_premium_ratio: formatNumber(item.transfer_premium_ratio),
      stock_price: formatNullableNumber(item.stock_price),
      bond_price: formatNullableNumber(item.bond_price),
    })),
    columns: [
      { key: 'bond_code', header: '债券代码' },
      { key: 'bond_short_name', header: '债券简称' },
      { key: 'stock_code', header: '正股代码' },
      { key: 'stock_name', header: '正股名称' },
      { key: 'issue_scale', header: '发行规模(亿)' },
      { key: 'transfer_premium_ratio', header: '转股溢价率(%)' },
      { key: 'stock_price', header: '正股价格' },
      { key: 'bond_price', header: '债券现价' },
    ],
    fileName: `convertible-bond-query-${datePart}.xlsx`,
    sheetName: '可转债筛选查询',
  })
}

onMounted(() => {
  handleQuery()
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

.main-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.main-card .el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-button {
  padding: 8px;
}

.placeholder {
  color: var(--el-text-color-secondary);
}
</style>
