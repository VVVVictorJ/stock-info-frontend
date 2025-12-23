

<template>
  <div class="stock-query">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>单股查询</span>
        </div>
      </template>
      <div class="toolbar">
        <el-input
          v-model="stockCode"
          placeholder="请输入股票代码，例如 600519"
          clearable
          class="code-input"
          @keyup.enter="onSearch"
        />
        <el-button type="primary" :loading="loading" @click="onSearch">查询</el-button>
      </div>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        class="mb8"
      />
      <el-table
        v-if="tableData.length"
        :data="tableData"
        size="small"
        border
        stripe
      >
        <el-table-column prop="f57" label="代码" width="140" />
        <el-table-column prop="f58" label="名称" width="140" />
        <el-table-column prop="f43" label="最新价" />
        <el-table-column prop="f170" label="涨跌幅" />
        <el-table-column prop="f50" label="量比" />
        <el-table-column prop="f162" label="市盈率-动态" />
        <el-table-column prop="f167" label="市净率" />
        <el-table-column prop="f191" label="委比" />
        <el-table-column prop="f137" label="主力净流入" />
      </el-table>
      <div v-else class="placeholder">
        请输入股票代码并点击查询
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { fetchSingleStock } from '@/api/stock'
import type { SingleStockData } from '@/types/stock'

const stockCode = ref<string>('600519')
const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const stockData = ref<SingleStockData | null>(null)

const fieldDefs = [
  { key: 'f57', label: '代码' },
  { key: 'f58', label: '名称' },
  { key: 'f43', label: '最新价' },
  { key: 'f170', label: '涨跌幅' },
  { key: 'f50', label: '量比' },
  { key: 'f162', label: '市盈率-动态' },
  { key: 'f167', label: '市净率' },
  { key: 'f191', label: '委比' },
  { key: 'f137', label: '主力净流入' },
] as const

type FieldKey = typeof fieldDefs[number]['key']

const tableData = computed(() => {
  if (!stockData.value) return []
  return [stockData.value]
})

async function onSearch() {
  errorMessage.value = ''
  stockData.value = null
  const code = stockCode.value?.trim()
  if (!code) {
    errorMessage.value = '请输入股票代码'
    return
  }
  loading.value = true
  try {
    const data = await fetchSingleStock({ code, source: 'em' })
    console.log(stockData.value)
    stockData.value = data.data
  } catch (err: any) {
    errorMessage.value = err?.message ?? '查询失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.stock-query {
  padding: 8px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.code-input {
  max-width: 240px;
}
.mb8 {
  margin-bottom: 8px;
}
.placeholder {
  color: var(--el-text-color-secondary);
}
</style>


