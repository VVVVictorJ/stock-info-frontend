<template>
  <el-table
    :data="props.items"
    :class="{'dense-table': props.dense}"
    size="small"
    border
    stripe
  >
    <el-table-column
      v-for="def in displayedFields"
      :key="def.key"
      :prop="def.key"
      :label="def.label"
      :min-width="def.key === 'f58' ? 140 : 100"
      :show-overflow-tooltip="true"
      :align="numericKeys.has(def.key) ? 'right' : 'left'"
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
import { computed } from 'vue'

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


