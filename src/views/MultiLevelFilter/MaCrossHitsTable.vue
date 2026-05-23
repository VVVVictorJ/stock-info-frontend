<template>
  <div class="table-wrap hits-table-wrap">
    <el-table
      :data="pagedRows"
      stripe
      border
      height="100%"
      :empty-text="emptyText"
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
      <el-table-column prop="ma5_current" label="MA5（当期）" width="118" align="right" />
      <el-table-column prop="ma20_current" label="MA20（当期）" width="128" align="right" />
      <el-table-column prop="ma5_prev" label="MA5（前序）" width="118" align="right" />
      <el-table-column prop="ma20_prev" label="MA20（前序）" width="128" align="right" />
    </el-table>
    <div v-if="data.length > 0" class="pager-bar">
      <el-pagination
        v-model:current-page="currentPage"
        layout="total, prev, pager, next, jumper"
        :page-size="PAGE_SIZE"
        :total="data.length"
        small
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { MonthlyMaCrossItem } from '@/types/multiLevelFilter'

const PAGE_SIZE = 30

const props = defineProps<{
  data: MonthlyMaCrossItem[]
  emptyText?: string
}>()

const currentPage = ref(1)

watch(
  () => props.data,
  () => {
    currentPage.value = 1
  },
)

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return props.data.slice(start, start + PAGE_SIZE)
})

function sortLatestPrice(a: MonthlyMaCrossItem, b: MonthlyMaCrossItem) {
  const na = Number.parseFloat(String(a.latest_price ?? ''))
  const nb = Number.parseFloat(String(b.latest_price ?? ''))
  const fa = Number.isFinite(na) ? na : Number.NEGATIVE_INFINITY
  const fb = Number.isFinite(nb) ? nb : Number.NEGATIVE_INFINITY
  return fa - fb
}
</script>

<style scoped>
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

.pager-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
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
