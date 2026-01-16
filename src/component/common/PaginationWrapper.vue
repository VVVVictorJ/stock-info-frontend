<template>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPageModel"
      v-model:page-size="pageSizeModel"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  currentPage: number
  pageSize: number
  total: number
  pageSizes?: number[]
  layout?: string
}>(), {
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper'
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  'size-change': [size: number]
  'current-change': [page: number]
  'change': []
}>()

const currentPageModel = computed({
  get: () => props.currentPage,
  set: (val) => emit('update:currentPage', val)
})

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val)
})

function handleSizeChange(size: number) {
  emit('size-change', size)
  emit('change')
}

function handleCurrentChange(page: number) {
  emit('current-change', page)
  emit('change')
}
</script>

<style scoped>
.pagination-container {
  flex-shrink: 0;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  background: white;
  z-index: 10;
}
</style>
