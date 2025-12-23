

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
        <el-table-column
          v-for="def in fieldDefs"
          :key="def.key"
          :prop="def.key"
          :label="def.label"
          :min-width="def.key === 'f58' ? 140 : 100"
        >
          <template #default="{ row }">
            <span :class="isPnField(def.key) ? getPnClass(row[def.key]) : ''">
              <template v-if="def.key === 'f137'">
                {{ formatThousand(row[def.key]) }}
              </template>
              <template v-else>
                {{ row[def.key] }}
              </template>
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="placeholder">
        请输入股票代码并点击查询
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  { key: 'f168', label: '换手率' },
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
    stockData.value = data.data
  } catch (err: any) {
    errorMessage.value = err?.message ?? '查询失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  onSearch()
})

function isPnField(key: string): boolean {
  return key === 'f170' || key === 'f191' || key === 'f137' || key === 'f50' || key === 'f168'
}

function getPnClass(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return ''
  if (num > 0) return 'pn-pos'
  if (num < 0) return 'pn-neg'
  return ''
}

function formatThousand(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return String(value ?? '')
  return new Intl.NumberFormat('en-US').format(num)
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
.pn-pos {
  color: var(--el-color-danger);
}
.pn-neg {
  color: var(--el-color-success);
}
</style>


