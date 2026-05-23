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
            <el-button
              type="primary"
              :loading="loadingMonthly"
              :disabled="loadingDaily"
              @click="runMaCross"
            >
              MA5×MA20 月线刚上穿
            </el-button>
            <el-button
              type="primary"
              plain
              :loading="loadingDaily"
              :disabled="loadingMonthly"
              @click="runDailyAfterMonthly"
            >
              MA5×MA20 日线刚上穿（基于月线命中）
            </el-button>
            <el-button disabled title="预留">待扩展 2</el-button>
          </div>
        </div>
      </div>
      <p class="hint">
        月线：以东财月 K（klt=103；beg/end YYYYMMDD）作用于 <code>stock_snapshots</code> 去重快照股，最后一根月 K 为「当前」。日线二次筛选：仅对月线命中股拉日 K（klt=101，约近 150
        个自然日、不写库），以<strong>最后一个交易日</strong>判断 MA5 是否刚上穿 MA20。
        <code>stock_table</code> / <code>stock_plate</code> 与交易日查询同源。
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
        <span>命中标的</span>
      </template>
      <el-tabs v-model="activeHitTab" class="hit-tabs" type="border-card">
        <el-tab-pane name="monthly">
          <template #label>
            <span>
              月线命中
              <el-badge :value="items.length" type="primary" class="tab-badge-ml" />
            </span>
          </template>
          <MaCrossHitsTable :data="items" empty-text="暂无数据，请先查询" />
        </el-tab-pane>
        <el-tab-pane name="daily">
          <template #label>
            <span>
              日线二次命中
              <el-badge :value="dailyItems.length" type="success" class="tab-badge-ml" />
            </span>
          </template>
          <MaCrossHitsTable
            :data="dailyItems"
            empty-text="暂无数据：月线无命中，或日线条件未满足；仅点「日线二次」时也会拉月线并同步两 Tab，本 Tab 的 MA 为日线口径。"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-collapse v-model="collapseMonthlySkips" class="skip-collapse">
      <el-collapse-item name="monthly_skipped">
        <template #title>
          <span class="collapse-title-text">
            未纳入月线结果（{{ monthlySkippedCount }} 只）
            <span v-if="monthlySkippedCount === 0" class="collapse-title-muted">暂无</span>
          </span>
        </template>
        <SkipReasonTable :data="skippedFull" empty-text="无跳过记录" />
      </el-collapse-item>
    </el-collapse>

    <el-collapse v-model="collapseDailySkips" class="skip-collapse">
      <el-collapse-item name="daily_skipped">
        <template #title>
          <span class="collapse-title-text">
            日线未达标（来自月线命中，{{ dailySkippedCount }} 只）
            <span v-if="dailySkippedCount === 0" class="collapse-title-muted">暂无</span>
          </span>
        </template>
        <SkipReasonTable :data="dailySkippedFull" empty-text="无记录（或未运行日线二次筛查）" />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { runMonthlyMaCrossFilter, runDailyMaCrossAfterMonthly, fetchStockPlatesList } from '@/api/stock'
import type {
  MonthlyMaCrossRequest,
  MonthlyMaCrossItem,
  SkippedStock,
} from '@/types/multiLevelFilter'
import MaCrossHitsTable from './MaCrossHitsTable.vue'
import SkipReasonTable from './SkipReasonTable.vue'

const loadingMonthly = ref(false)
const loadingDaily = ref(false)
const errorMessage = ref('')
const items = ref<MonthlyMaCrossItem[]>([])
const dailyItems = ref<MonthlyMaCrossItem[]>([])
const skippedFull = ref<SkippedStock[]>([])
const dailySkippedFull = ref<SkippedStock[]>([])
const plateOptions = ref<Array<{ plate_code: string; name: string }>>([])
const filterPlates = ref<string[]>([])
/** 月线跳过：默认收起 */
const collapseMonthlySkips = ref<string[]>([])
/** 日线未达标：默认收起 */
const collapseDailySkips = ref<string[]>([])
const activeHitTab = ref<'monthly' | 'daily'>('monthly')

const monthlySkippedCount = computed(() => skippedFull.value.length)
const dailySkippedCount = computed(() => dailySkippedFull.value.length)

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

function buildPayload(): MonthlyMaCrossRequest {
  return filterPlates.value.length > 0 ? { filter_plate_codes: [...filterPlates.value] } : {}
}

async function runMaCross() {
  errorMessage.value = ''
  loadingMonthly.value = true
  items.value = []
  dailyItems.value = []
  skippedFull.value = []
  dailySkippedFull.value = []
  collapseMonthlySkips.value = []
  collapseDailySkips.value = []
  activeHitTab.value = 'monthly'
  try {
    const res = await runMonthlyMaCrossFilter(buildPayload())
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
    loadingMonthly.value = false
  }
}

async function runDailyAfterMonthly() {
  errorMessage.value = ''
  loadingDaily.value = true
  try {
    const res = await runDailyMaCrossAfterMonthly(buildPayload())
    items.value = (res.monthly?.items ?? []).map((row) => mapItem(row))
    skippedFull.value = (res.monthly?.skipped ?? []).map((s) => ({
      stock_code: s.stock_code,
      stock_name: s.stock_name ?? '',
      plates: s.plates ?? [],
      reason: s.reason ?? '',
    }))
    dailyItems.value = (res.daily_refinement?.items ?? []).map((row) => mapItem(row))
    dailySkippedFull.value = (res.daily_refinement?.skipped ?? []).map((s) => ({
      stock_code: s.stock_code,
      stock_name: s.stock_name ?? '',
      plates: s.plates ?? [],
      reason: s.reason ?? '',
    }))
    activeHitTab.value = 'daily'
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e
        ? String((e as { message: unknown }).message)
        : String(e)
    errorMessage.value = msg || '请求失败'
  } finally {
    loadingDaily.value = false
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

.hit-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hit-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hit-tabs :deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tab-badge-ml :deep(.el-badge__content) {
  translate: 4px 0;
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
</style>
