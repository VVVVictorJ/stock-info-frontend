<template>
  <div class="table-wrap skip-table-wrap">
    <el-table
      :data="data"
      stripe
      border
      height="100%"
      :empty-text="emptyText"
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
</template>

<script setup lang="ts">
import type { SkippedStock } from '@/types/multiLevelFilter'

defineProps<{
  data: SkippedStock[]
  emptyText?: string
}>()
</script>

<style scoped>
.table-wrap {
  flex: 1;
  height: clamp(240px, 36vh, 440px);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.scroll-table {
  width: 100%;
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
