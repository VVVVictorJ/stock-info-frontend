<script setup lang="ts">
import { computed, reactive } from 'vue'

type PositionKey = 'top0' | 'top1' | 'top2' | 'top3' | 'bottom0' | 'bottom1' | 'bottom2' | 'bottom3'

interface BaguaSide {
  id: 'river' | 'luo'
  title: string
  labels: string[]
  values: Record<PositionKey, string>
}

type Formula = PositionKey[]

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

const resultTables = computed(() =>
  sides.map((side) => ({
    id: side.id,
    rows: formulas.map((row) => row.map((formula) => calculateFormula(side.values, formula))),
  })),
)

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

function getTopKey(index: number): PositionKey {
  return topKeys[index] ?? 'top0'
}

function getBottomKey(index: number): PositionKey {
  return bottomKeys[index] ?? 'bottom0'
}
</script>

<template>
  <main class="bagua-page">
    <section class="page-header">
      <p class="eyebrow">八卦计算</p>
      <h1>河洛排盘</h1>
      <p class="description">填写上下两行数字，下方表格会按固定公式实时生成结果。</p>
    </section>

    <section class="bagua-groups" aria-label="河洛输入与结果">
      <article v-for="side in sides" :key="side.id" class="bagua-card">
        <div class="input-area">
          <h2>{{ side.title }}</h2>

          <div class="input-grid" :aria-label="`${side.title}输入区`">
            <template v-for="(label, index) in side.labels" :key="`${side.id}-top-${index}`">
              <input
                v-model="side.values[getTopKey(index)]"
                class="number-input top-number"
                inputmode="numeric"
                pattern="[0-9]*"
                type="number"
                aria-label="上方数字"
              />
            </template>

            <template v-for="(label, index) in side.labels" :key="`${side.id}-stem-${index}`">
              <div class="label-cell stem">{{ label.slice(0, 1) }}</div>
            </template>

            <template v-for="(label, index) in side.labels" :key="`${side.id}-branch-${index}`">
              <div class="label-cell branch">{{ label.slice(1) }}</div>
            </template>

            <template v-for="(label, index) in side.labels" :key="`${side.id}-bottom-${index}`">
              <input
                v-model="side.values[getBottomKey(index)]"
                class="number-input bottom-number"
                inputmode="numeric"
                pattern="[0-9]*"
                type="number"
                aria-label="下方数字"
              />
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
.label-cell {
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
  .label-cell {
    height: 40px;
  }

  .label-cell {
    font-size: 22px;
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
