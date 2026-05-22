<template>
  <div class="multi-level-filter-page">
    <el-card shadow="never" class="toolbar-card">
      <div class="query-toolbar">
        <div class="query-left">
          <el-select
            v-model="filterPlates"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="板块筛选（可多选，与交易日查询一致）"
            class="plate-select"
          >
            <el-option
              v-for="plate in plateOptions"
              :key="plate.plate_code"
              :label="plate.name"
              :value="plate.plate_code"
            />
          </el-select>
          <div class="query-actions-inline">
            <el-button type="primary" :loading="loading" @click="runMaCross">
              MA5×MA20 月线刚上穿
            </el-button>
            <el-button disabled title="预留">待扩展 1</el-button>
            <el-button disabled title="预留">待扩展 2</el-button>
          </div>
        </div>
      </div>
      <p class="hint">
        依据 <code>stock_snapshots</code> 每股最新快照去重拉取月线（东方财富月 K，klt=103；
        beg/end 为东财要求的 YYYYMMDD），以<strong>序列最后一根月 K</strong>为「当前」判断是否符合刚上穿；价格为快照最新价；板块与同库
        <code>stock_table</code> /
        <code>stock_plate</code> 关联，与<strong>交易日查询</strong>同源。
      </p>
      <el-alert
        v-if="errorMessage"
        type="error"
        :closable="false"
        show-icon
        class="err"
        :title="errorMessage"
      />
    </el-card>

    <el-card shadow="never" class="result-card">
      <template #header>
        <span>命中标的（{{ items.length }}）</span>
      </template>
      <div class="table-wrap hits-table-wrap">
        <el-table
          :data="items"
          stripe
          border
          height="100%"
          empty-text="暂无数据，请先查询"
          class="scroll-table"
        >
          <el-table-column prop="stock_code" label="代码" width="110" />
          <el-table-column prop="stock_name" label="名称" min-width="130" />
          <el-table-column label="板块" min-width="200">
            <template #default="{ row }">
              <div v-if="row.plates?.length" class="plate-tags">
                <el-tag
                  v-for="plate in row.plates"
                  :key="plate.plate_code"
                  size="small"
                  class="plate-tag"
                  effect="light"
                >
                  {{ plate.name }}
                </el-tag>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="当前价格"
            prop="latest_price"
            width="130"
            align="right"
            sortable
            :sort-method="sortLatestPrice"
          >
            <template #default="{ row }">
              {{ row.latest_price }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-collapse v-model="collapseActiveSkips" class="skip-collapse">
      <el-collapse-item name="skipped">
        <template #title>
          <span class="collapse-title-text">
            未纳入结果（{{ skippedCount }} 只）
            <span v-if="skippedCount === 0" class="collapse-title-muted">暂无</span>
          </span>
        </template>
        <div class="table-wrap skip-table-wrap">
          <el-table
            :data="skippedFull"
            stripe
            border
            height="100%"
            empty-text="无跳过记录"
            class="scroll-table"
          >
            <el-table-column prop="stock_code" label="代码" width="110" />
            <el-table-column prop="stock_name" label="名称" min-width="120" />
            <el-table-column label="板块" min-width="200">
              <template #default="{ row }">
                <div v-if="row.plates?.length" class="plate-tags">
                  <el-tag
                    v-for="plate in row.plates"
                    :key="plate.plate_code"
                    size="small"
                    class="plate-tag"
                    effect="light"
                  >
                    {{ plate.name }}
                  </el-tag>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" show-overflow-tooltip min-width="340" />
          </el-table>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { runMonthlyMaCrossFilter, fetchStockPlatesList } from '@/api/stock'
import type { MonthlyMaCrossRequest, MonthlyMaCrossItem, SkippedStock } from '@/types/multiLevelFilter'

const loading = ref(false)
const errorMessage = ref('')
const items = ref<MonthlyMaCrossItem[]>([])
const skippedFull = ref<SkippedStock[]>([])
const plateOptions = ref<Array<{ plate_code: string; name: string }>>([])
const filterPlates = ref<string[]>([])
/** 折叠面板：默认收起「未纳入结果」表格 */
const collapseActiveSkips = ref<string[]>([])

const skippedCount = computed(() => skippedFull.value.length)

function sortLatestPrice(a: MonthlyMaCrossItem, b: MonthlyMaCrossItem) {
  const na = Number.parseFloat(String(a.latest_price ?? ''))
  const nb = Number.parseFloat(String(b.latest_price ?? ''))
  const fa = Number.isFinite(na) ? na : Number.NEGATIVE_INFINITY
  const fb = Number.isFinite(nb) ? nb : Number.NEGATIVE_INFINITY
  return fa - fb
}

function mapItem(row: MonthlyMaCrossItem): MonthlyMaCrossItem {
  return {
    stock_code: row.stock_code,
    stock_name: row.stock_name,
    latest_price: String(row.latest_price),
    plates: row.plates ?? [],
    ma5_current: row.ma5_current != null ? String(row.ma5_current) : undefined,
    ma20_current: row.ma20_current != null ? String(row.ma20_current) : undefined,
    ma5_prev: row.ma5_prev != null ? String(row.ma5_prev) : undefined,
    ma20_prev: row.ma20_prev != null ? String(row.ma20_prev) : undefined,
  }
}

async function loadPlateDict() {
  try {
    const list = await fetchStockPlatesList()
    plateOptions.value = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
  } catch {
    plateOptions.value = []
  }
}

async function runMaCross() {
  errorMessage.value = ''
  loading.value = true
  items.value = []
  skippedFull.value = []
  collapseActiveSkips.value = []
  try {
    const payload: MonthlyMaCrossRequest =
      filterPlates.value.length > 0 ? { filter_plate_codes: [...filterPlates.value] } : {}
    const res = await runMonthlyMaCrossFilter(payload)
    items.value = (res.items ?? []).map((row) => mapItem(row))
    skippedFull.value = (res.skipped ?? []).map((s) => ({
      stock_code: s.stock_code,
      stock_name: s.stock_name ?? '',
      plates: s.plates ?? [],
      reason: s.reason ?? '',
    }))
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e
        ? String((e as { message: unknown }).message)
        : String(e)
    errorMessage.value = msg || '请求失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPlateDict()
})
</script>

<style scoped>
.multi-level-filter-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
}

.query-toolbar {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(31, 45, 61, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-sizing: border-box;
  margin-bottom: 12px;
}

.query-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.plate-select {
  width: 280px;
  min-width: 200px;
}

.query-actions-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.toolbar-card .hint {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.toolbar-card .err {
  margin-top: 12px;
}

.result-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.result-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-top: 8px;
}

.table-wrap {
  flex: 1;
  min-height: 260px;
  height: clamp(260px, 42vh, 520px);
  display: flex;
  flex-direction: column;
}

.hits-table-wrap {
  flex: 1;
}

.scroll-table {
  width: 100%;
}

.skip-collapse {
  flex-shrink: 0;
}

.skip-collapse :deep(.el-collapse-item__header) {
  font-weight: 600;
  padding-left: 4px;
}

.collapse-title-muted {
  font-weight: normal;
  color: var(--el-text-color-secondary);
  margin-left: 6px;
  font-size: 13px;
}

.skip-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 12px;
}

.skip-table-wrap {
  height: clamp(240px, 36vh, 440px);
  min-height: 200px;
}

.plate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.plate-tag {
  margin: 2px 0;
}
</style>
