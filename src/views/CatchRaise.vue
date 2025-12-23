
<template>
  <div class="stock-query">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>实时查询符合涨停板条件的股票</span>
        </div>
      </template>
      <div class="toolbar">
        <el-input
          v-model.number="limit"
          type="number"
          placeholder="返回条数（可选）"
          class="code-input"
          min="0"
        />
        <el-button type="primary" :loading="loading" @click="loadData">刷新</el-button>
      </div>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        class="mb8"
      />
      <el-table
        v-if="items.length"
        :data="items"
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
        暂无数据
      </div>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchCatchRaiseStock } from '@/api/stock'
import type { CatchRaiseStockData } from '@/types/stock'

const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const items = ref<CatchRaiseStockData[]>([])
const limit = ref<number | undefined>(0)

// 列定义映射为中文表头
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


async function loadData() {
  errorMessage.value = ''
  loading.value = true
  try {
    const res = await fetchCatchRaiseStock({
      limit: limit.value,
    })
    items.value = res.items ?? []
  } catch (err: any) {
    errorMessage.value = err?.message ?? '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
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


