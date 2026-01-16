<template>
  <ResultCard title="查询结果" class="result-panel">
    <div class="result-controls">
      <el-switch v-model="dense" size="small" active-text="紧凑" />
      <el-divider direction="vertical" />
      <el-popover placement="bottom" trigger="click" :width="260">
        <template #reference>
          <el-button size="small" plain>显示列</el-button>
        </template>
        <div class="columns-panel">
          <el-checkbox-group v-model="visibleKeys">
            <el-checkbox v-for="def in fieldDefs" :key="def.key" :value="def.key">
              {{ def.label }}
            </el-checkbox>
          </el-checkbox-group>
          <div class="col-actions">
            <el-button size="small" text @click="selectAllCols">全选</el-button>
            <el-button size="small" text @click="clearAllCols">全不选</el-button>
          </div>
        </div>
      </el-popover>
    </div>
    <CatchRasieTable
      v-if="items.length"
      :items="items"
      :field-defs="fieldDefs"
      :dense="dense"
      :visible-keys="visibleKeys"
    />
    <div v-else class="placeholder">暂无数据</div>
  </ResultCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ResultCard from '@/component/common/ResultCard.vue'
import CatchRasieTable from '@/component/CatchRasieTable.vue'
import type { CatchRaiseStockData } from '@/types/stock'

export interface FieldDef {
  key: string
  label: string
}

defineProps<{
  items: CatchRaiseStockData[]
  fieldDefs: readonly FieldDef[]
}>()

// 内部状态：紧凑模式和可见列
const dense = ref<boolean>(false)
const visibleKeys = ref<string[]>([])

function selectAllCols() {
  // 获取所有字段的 key
  visibleKeys.value = ['f57', 'f58', 'f43', 'f170', 'f50', 'f168', 'f191', 'f137']
}

function clearAllCols() {
  visibleKeys.value = []
}
</script>

<style scoped>
.result-panel {
  margin-top: 12px;
}

.result-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.columns-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.placeholder {
  color: var(--el-text-color-secondary);
}
</style>
