<template>
  <el-table
    :data="sortedItems"
    :class="{'dense-table': props.dense}"
    size="small"
    border
    stripe
    @sort-change="onSortChange"
  >
    <el-table-column
      v-for="def in displayedFields"
      :key="def.key"
      :prop="def.key"
      :label="def.label"
      :min-width="def.key === 'f58' ? 140 : 100"
      :show-overflow-tooltip="true"
      :align="numericKeys.has(def.key) ? 'right' : 'left'"
      :sortable="isSortable(def.key) ? 'custom' : false"
    >
      <template #default="{ row }">
        <span :class="getPnClass(row[def.key], def.key)">
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface FieldDef {
  key: string
  label: string
}

const props = defineProps<{
  items: Array<Record<string, unknown>>
  fieldDefs: ReadonlyArray<FieldDef>
  dense?: boolean
  visibleKeys?: string[]
}>()

const pnKeys = new Set(['f170', 'f191', 'f137', 'f50', 'f168'])
const numericKeys = new Set(['f43', 'f170', 'f50', 'f168', 'f191', 'f137'])
const displayedFields = computed(() => {
  if (!props.visibleKeys || !props.visibleKeys.length) return props.fieldDefs
  const keySet = new Set(props.visibleKeys)
  return props.fieldDefs.filter(d => keySet.has(d.key))
})

// ===== 排序逻辑 =====
const sortProp = ref<string>('')
const sortOrder = ref<'ascending' | 'descending' | null>(null)

function isSortable(key: string): boolean {
  return key !== 'f57' && key !== 'f58'
}

const sortedItems = computed(() => {
  const data = props.items || []
  if (!sortProp.value || !sortOrder.value) return data
  const prop = sortProp.value
  const order = sortOrder.value
  const arr = [...data]
  arr.sort((a: any, b: any) => {
    const av = a?.[prop]
    const bv = b?.[prop]
    const an = typeof av === 'number' ? av : Number(av)
    const bn = typeof bv === 'number' ? bv : Number(bv)
    let cmp: number
    if (!Number.isNaN(an) && !Number.isNaN(bn)) {
      cmp = an - bn
    } else {
      const as = av?.toString?.() ?? ''
      const bs = bv?.toString?.() ?? ''
      cmp = as.localeCompare(bs)
    }
    return order === 'ascending' ? cmp : -cmp
  })
  return arr
})

function onSortChange(e: { prop: string; order: 'ascending' | 'descending' | null }) {
  if (!e.order || !e.prop || !isSortable(e.prop)) {
    sortProp.value = ''
    sortOrder.value = null
    return
  }
  sortProp.value = e.prop
  sortOrder.value = e.order
}

function getPnClass(value: unknown, key: string): string {
  if (!pnKeys.has(key)) return ''
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
.pn-pos {
  color: var(--el-color-danger);
}
.pn-neg {
  color: var(--el-color-success);
}
.dense-table {
  font-size: 12px;
  --el-table-row-height: 34px;
}
.dense-table :deep(.el-table__cell) {
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>


