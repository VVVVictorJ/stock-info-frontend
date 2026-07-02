<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { fetchAlmanac, fetchHetuCrossLookup, fetchHetuLookup, fetchLuoshuBranchLookup, fetchLuoshuStemLookup } from '@/api/bagua'

type PositionKey = 'top0' | 'top1' | 'top2' | 'top3' | 'bottom0' | 'bottom1' | 'bottom2' | 'bottom3'

interface BaguaSide {
  id: 'river' | 'luo'
  title: string
  labels: string[]
  values: Record<PositionKey, string>
}

type Formula = PositionKey[]

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
const RIVER_BRANCH_OPTIONS = ['寅', '卯', '巳', '午', '辰', '戌', '丑', '未', '申', '酉', '亥', '子'] as const
const MEMO_STORAGE_KEY = 'bagua-memo'

const rowLabels = ['一', '二', '三', '四', '五', '六', '七', '八']
const maxResultColumns = 6
const topKeys: PositionKey[] = ['top0', 'top1', 'top2', 'top3']
const bottomKeys: PositionKey[] = ['bottom0', 'bottom1', 'bottom2', 'bottom3']

const sides = reactive<BaguaSide[]>([
  {
    id: 'river',
    title: '河',
    labels: ['戊午', '戊辰', '丙申', '丙午'],
    values: createEmptyValues(),
  },
  {
    id: 'luo',
    title: '洛',
    labels: ['戊午', '戊辰', '丙申', '丙午'],
    values: createEmptyValues(),
  },
])

const riverRow2Stems = ref(['', '', '', ''])
const riverRow3Branches = ref(['', '', '', ''])
const luoRow2Stems = ref(['', '', '', ''])
const luoRow3Branches = ref(['', '', '', ''])
const yearBranch = ref('')
const hetuLookupMap = ref<Map<string, number>>(new Map())
const hetuCrossMap = ref<Map<string, number>>(new Map())
const luoshuStemMap = ref<Map<string, number>>(new Map())
const luoshuBranchMap = ref<Map<string, number>>(new Map())
const memoText = ref(localStorage.getItem(MEMO_STORAGE_KEY) ?? '')
const memoInput = ref<HTMLTextAreaElement | null>(null)
const dataLoading = ref(true)
const dataError = ref('')

const formulas: Formula[][] = [
  [
    ['top0', 'top1'],
    ['top0', 'bottom0'],
  ],
  [
    ['bottom0', 'top0'],
    ['bottom0', 'top1'],
    ['bottom0', 'top0', 'top1'],
    ['bottom0', 'bottom1'],
  ],
  [
    ['top1', 'top0'],
    ['top1', 'top2'],
    ['top0', 'top1', 'top2'],
    ['top1', 'bottom0'],
    ['top1', 'bottom1'],
    ['top1', 'bottom0', 'bottom1'],
  ],
  [
    ['bottom1', 'top1'],
    ['bottom1', 'top2'],
    ['bottom1', 'top1', 'top2'],
    ['bottom1', 'bottom0'],
    ['bottom1', 'bottom2'],
    ['bottom1', 'bottom0', 'bottom2'],
  ],
  [
    ['top2', 'top1'],
    ['top2', 'top3'],
    ['top2', 'top1', 'top3'],
    ['top2', 'bottom1'],
    ['top2', 'bottom2'],
    ['top2', 'bottom1', 'bottom2'],
  ],
  [
    ['bottom2', 'top2'],
    ['bottom2', 'top3'],
    ['bottom2', 'top2', 'top3'],
    ['bottom2', 'bottom1'],
    ['bottom2', 'bottom3'],
    ['bottom2', 'bottom1', 'bottom3'],
  ],
  [
    ['top3', 'top2'],
    ['top3', 'bottom2'],
    ['top3', 'bottom3'],
    ['top3', 'bottom2', 'bottom3'],
  ],
  [
    ['bottom3', 'top3'],
    ['bottom3', 'bottom2'],
  ],
]

function createEmptyValues(): Record<PositionKey, string> {
  return {
    top0: '',
    top1: '',
    top2: '',
    top3: '',
    bottom0: '',
    bottom1: '',
    bottom2: '',
    bottom3: '',
  }
}

function lookupInMap(map: Map<string, number>, rowKey: string, colKey: string): string {
  if (!rowKey || !colKey) {
    return ''
  }
  const value = map.get(`${rowKey}|${colKey}`)
  return value === undefined ? '' : String(value)
}

function normalizeHetuBranch(branch: string): string {
  if (branch === '戌') {
    return '辰'
  }
  if (branch === '未') {
    return '丑'
  }
  return branch
}

function lookupValue(stem: string, branch: string): string {
  return lookupInMap(hetuLookupMap.value, branch, stem)
}

const riverTopNumbers = computed(() => {
  const branch = yearBranch.value
  return riverRow2Stems.value.map((stem) => lookupValue(stem, branch))
})

const riverBottomNumbers = computed(() =>
  riverRow3Branches.value.map((branch) =>
    lookupInMap(
      hetuCrossMap.value,
      normalizeHetuBranch(yearBranch.value),
      normalizeHetuBranch(branch),
    ),
  ),
)

const luoTopNumbers = computed(() => {
  const branch = yearBranch.value
  return luoRow2Stems.value.map((stem) => lookupInMap(luoshuStemMap.value, branch, stem))
})

const luoBottomNumbers = computed(() => {
  const rowKey = yearBranch.value
  return luoRow3Branches.value.map((colKey) => lookupInMap(luoshuBranchMap.value, rowKey, colKey))
})

function syncRiverValues() {
  const river = sides.find((side) => side.id === 'river')
  if (!river) {
    return
  }

  topKeys.forEach((key, index) => {
    river.values[key] = riverTopNumbers.value[index] ?? ''
  })

  bottomKeys.forEach((key, index) => {
    river.values[key] = riverBottomNumbers.value[index] ?? ''
  })
}

watch([riverTopNumbers, riverBottomNumbers, yearBranch], syncRiverValues, { deep: true })

function autoResizeMemo() {
  const el = memoInput.value
  if (!el) {
    return
  }
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(memoText, (value) => {
  localStorage.setItem(MEMO_STORAGE_KEY, value)
  nextTick(autoResizeMemo)
})

function syncLuoValues() {
  const luo = sides.find((side) => side.id === 'luo')
  if (!luo) {
    return
  }

  topKeys.forEach((key, index) => {
    luo.values[key] = luoTopNumbers.value[index] ?? ''
  })

  bottomKeys.forEach((key, index) => {
    luo.values[key] = luoBottomNumbers.value[index] ?? ''
  })
}

watch([luoTopNumbers, luoRow3Branches, yearBranch], syncLuoValues, { deep: true })

const resultTables = computed(() =>
  sides.map((side) => ({
    id: side.id,
    rows: formulas.map((row) => row.map((formula) => calculateFormula(side.values, formula))),
  })),
)

function calculateFormula(values: Record<PositionKey, string>, formula: Formula): string {
  const numbers = formula.map((key) => toNumber(values[key]))
  if (numbers.some((value) => value === null)) {
    return ''
  }

  let total = 0
  for (const value of numbers) {
    total += Number(value)
  }
  return String(total)
}

function toNumber(value: string | number): number | null {
  if (value === '') {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function getResultRows(sideId: BaguaSide['id']): string[][] {
  return resultTables.value.find((table) => table.id === sideId)?.rows ?? []
}

function buildLookupMap(cells: { row_key: string; col_key: string; value: number }[]) {
  const map = new Map<string, number>()
  for (const cell of cells) {
    map.set(`${cell.row_key}|${cell.col_key}`, cell.value)
  }
  return map
}

async function loadBaguaData() {
  dataLoading.value = true
  dataError.value = ''

  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1)
  const day = String(now.getDate())

  try {
    const [hetu, hetuCross, luoshuStem, luoshuBranch, almanac] = await Promise.all([
      fetchHetuLookup(),
      fetchHetuCrossLookup(),
      fetchLuoshuStemLookup(),
      fetchLuoshuBranchLookup(),
      fetchAlmanac(year, month, day),
    ])

    hetuLookupMap.value = buildLookupMap(hetu.cells)
    hetuCrossMap.value = buildLookupMap(hetuCross.cells)
    luoshuStemMap.value = buildLookupMap(luoshuStem.cells)
    luoshuBranchMap.value = buildLookupMap(luoshuBranch.cells)
    yearBranch.value = almanac.year_branch
    syncRiverValues()
    syncLuoValues()
  } catch (error) {
    dataError.value = error instanceof Error ? error.message : '数据加载失败'
  } finally {
    dataLoading.value = false
  }
}

onMounted(() => {
  loadBaguaData()
  nextTick(autoResizeMemo)
})
</script>

<template>
  <main class="bagua-page">
    <section class="page-header">
      <textarea
        ref="memoInput"
        v-model="memoText"
        class="memo-input"
        placeholder="备忘..."
        rows="3"
        aria-label="备忘"
        @input="autoResizeMemo"
      />
      <p v-if="dataLoading" class="status-text">正在加载河图与黄历数据…</p>
      <p v-else-if="dataError" class="status-text error">{{ dataError }}</p>
    </section>

    <section class="bagua-groups" aria-label="河洛输入与结果">
      <article v-for="side in sides" :key="side.id" class="bagua-card">
        <div class="input-area">
          <h2>{{ side.title }}</h2>

          <div v-if="side.id === 'river'" class="input-grid" :aria-label="`${side.title}输入区`">
            <template v-for="(num, index) in riverTopNumbers" :key="`${side.id}-top-${index}`">
              <div class="number-display top-number" aria-label="上方数字">
                {{ num }}
              </div>
            </template>

            <template v-for="(_, index) in riverRow2Stems" :key="`${side.id}-stem-select-${index}`">
              <select
                v-model="riverRow2Stems[index]"
                class="stem-select"
                :aria-label="`第二行天干${index + 1}`"
              >
                <option value="">—</option>
                <option v-for="stem in HEAVENLY_STEMS" :key="stem" :value="stem">
                  {{ stem }}
                </option>
              </select>
            </template>

            <template v-for="(_, index) in riverRow3Branches" :key="`${side.id}-branch-select-${index}`">
              <select
                v-model="riverRow3Branches[index]"
                class="stem-select bottom-stem"
                :aria-label="`第三行地支${index + 1}`"
              >
                <option value="">—</option>
                <option v-for="branch in RIVER_BRANCH_OPTIONS" :key="branch" :value="branch">
                  {{ branch }}
                </option>
              </select>
            </template>

            <template v-for="(num, index) in riverBottomNumbers" :key="`${side.id}-bottom-num-${index}`">
              <div class="number-display bottom-number" aria-label="下方数字">
                {{ num }}
              </div>
            </template>
          </div>

          <div v-else-if="side.id === 'luo'" class="input-grid" :aria-label="`${side.title}输入区`">
            <template v-for="(num, index) in luoTopNumbers" :key="`${side.id}-top-${index}`">
              <div class="number-display top-number" aria-label="上方数字">
                {{ num }}
              </div>
            </template>

            <template v-for="(_, index) in luoRow2Stems" :key="`${side.id}-stem-select-${index}`">
              <select
                v-model="luoRow2Stems[index]"
                class="stem-select"
                :aria-label="`第二行天干${index + 1}`"
              >
                <option value="">—</option>
                <option v-for="stem in HEAVENLY_STEMS" :key="stem" :value="stem">
                  {{ stem }}
                </option>
              </select>
            </template>

            <template v-for="(_, index) in luoRow3Branches" :key="`${side.id}-branch-select-${index}`">
              <select
                v-model="luoRow3Branches[index]"
                class="stem-select bottom-stem"
                :aria-label="`第三行地支${index + 1}`"
              >
                <option value="">—</option>
                <option v-for="branch in EARTHLY_BRANCHES" :key="branch" :value="branch">
                  {{ branch }}
                </option>
              </select>
            </template>

            <template v-for="(num, index) in luoBottomNumbers" :key="`${side.id}-bottom-num-${index}`">
              <div class="number-display bottom-number" aria-label="下方数字">
                {{ num }}
              </div>
            </template>
          </div>
        </div>

        <div class="result-table" :aria-label="`${side.title}结果区`">
          <div v-for="(row, rowIndex) in getResultRows(side.id)" :key="`${side.id}-row-${rowIndex}`" class="result-row">
            <div class="row-label">{{ rowLabels[rowIndex] }}</div>
            <div v-for="columnIndex in maxResultColumns" :key="columnIndex" class="result-cell">
              {{ row[columnIndex - 1] }}
            </div>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.bagua-page {
  height: 100vh;
  padding: 20px 14px 32px;
  overflow-y: auto;
  background:
    radial-gradient(circle at top left, rgba(85, 120, 255, 0.16), transparent 34%),
    linear-gradient(180deg, #f9fbff 0%, #eef3ff 100%);
  color: #172033;
  box-sizing: border-box;
}

.page-header {
  max-width: 720px;
  margin: 0 auto 18px;
  text-align: center;
}

.eyebrow {
  margin: 0 0 4px;
  color: #6677aa;
  font-size: 13px;
  letter-spacing: 0.2em;
}

h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

.description {
  margin: 8px 0 0;
  color: #5f6b82;
  font-size: 14px;
}

.memo-input {
  display: block;
  width: 100%;
  max-width: 720px;
  margin: 12px auto 0;
  padding: 10px 12px;
  border: 1px solid rgba(116, 135, 180, 0.35);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #c0392b;
  font-weight: 700;
  font-size: clamp(34px, 6vw, 72px);
  line-height: 1.4;
  resize: none;
  overflow: hidden;
  box-sizing: border-box;
}

.memo-input:focus {
  outline: none;
  border-color: rgba(85, 120, 255, 0.55);
  box-shadow: 0 0 0 2px rgba(85, 120, 255, 0.12);
}

.status-text {
  margin: 8px 0 0;
  color: #6677aa;
  font-size: 13px;
}

.status-text.error {
  color: #c0392b;
}

.bagua-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  max-width: 960px;
  margin: 0 auto;
}

.bagua-card {
  display: grid;
  gap: 16px;
  padding: 16px 12px;
  border: 1px solid rgba(116, 135, 180, 0.26);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 34px rgba(60, 82, 130, 0.14);
  backdrop-filter: blur(12px);
}

.input-area {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 34px;
  line-height: 1;
  writing-mode: vertical-rl;
  letter-spacing: 0.12em;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(44px, 1fr));
  border: 1px solid #1e2535;
  background: #1e2535;
  gap: 1px;
}

.number-input,
.number-display,
.label-cell,
.stem-select {
  width: 100%;
  min-width: 0;
  height: 44px;
  border: 0;
  border-radius: 0;
  text-align: center;
  box-sizing: border-box;
}

.number-input {
  padding: 0 4px;
  color: #2e241d;
  font: 600 19px/1.2 Georgia, 'Times New Roman', serif;
  appearance: textfield;
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.number-display {
  display: grid;
  place-items: center;
  color: #2e241d;
  font: 600 19px/1.2 Georgia, 'Times New Roman', serif;
}

.top-number {
  background: #f5ddcd;
}

.bottom-number {
  background: #fff4cf;
}

.label-cell {
  display: grid;
  place-items: center;
  background: #f8ead8;
  color: #261b16;
  font-size: 24px;
  font-weight: 600;
}

.stem-select {
  padding: 0 2px;
  background: #f8ead8;
  color: #261b16;
  font-size: 22px;
  font-weight: 600;
  font-family: Georgia, 'Times New Roman', serif;
  cursor: pointer;
  appearance: none;
}

.stem {
  background: #f8ead8;
}

.bottom-stem {
  background: #fff8dd;
}

.branch {
  background: #fff8dd;
}

.result-table {
  display: grid;
  gap: 1px;
  overflow: hidden;
  border: 1px solid #b3c2df;
  background: #b3c2df;
}

.result-row {
  display: grid;
  grid-template-columns: 38px repeat(6, minmax(38px, 1fr));
  gap: 1px;
  background: #b3c2df;
}

.row-label,
.result-cell {
  display: grid;
  place-items: center;
  min-height: 42px;
  color: #0f1728;
  font-weight: 700;
  font-size: 16px;
}

.row-label {
  background: #dbe5f7;
}

.result-cell {
  background: #ffffff;
}

.result-row:nth-child(even) .row-label,
.result-row:nth-child(even) .result-cell {
  background: #d7e1f4;
}

@media (min-width: 820px) {
  .page-header {
    max-width: 1100px;
  }

  .memo-input {
    max-width: 1100px;
  }

  .bagua-groups {
    max-width: 1280px;
    gap: 28px;
  }

  h2 {
    font-size: 52px;
  }

  .input-grid {
    grid-template-columns: repeat(4, minmax(72px, 1fr));
  }

  .number-input,
  .number-display,
  .label-cell,
  .stem-select {
    height: 68px;
  }

  .number-input,
  .number-display {
    font-size: 30px;
  }

  .label-cell {
    font-size: 34px;
  }

  .stem-select {
    font-size: 34px;
  }

  .result-row {
    grid-template-columns: 60px repeat(6, minmax(60px, 1fr));
  }

  .row-label,
  .result-cell {
    min-height: 64px;
    font-size: 26px;
  }
}

@media (max-width: 760px) {
  .bagua-groups {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .bagua-page {
    padding: 16px 10px 28px;
  }

  .bagua-card {
    padding: 14px 10px;
    border-radius: 18px;
  }

  .input-area {
    gap: 8px;
  }

  h2 {
    font-size: 30px;
  }

  .input-grid {
    grid-template-columns: repeat(4, minmax(38px, 1fr));
  }

  .number-input,
  .number-display,
  .label-cell,
  .stem-select {
    height: 40px;
  }

  .label-cell,
  .stem-select {
    font-size: 20px;
  }

  .result-row {
    grid-template-columns: 34px repeat(6, minmax(34px, 1fr));
  }

  .row-label,
  .result-cell {
    min-height: 39px;
    font-size: 15px;
  }
}
</style>
