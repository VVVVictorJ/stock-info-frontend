<template>
  <QueryCard
    title="查询条件"
    :error-message="errorMessage"
    :closable="true"
    @clear-error="$emit('clear-error')"
  >
    <el-date-picker
      :model-value="queryDate"
      @update:model-value="$emit('update:queryDate', $event)"
      type="date"
      placeholder="选择交易日期"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      class="date-picker"
    />
    <el-select
      :model-value="pageSize"
      @update:model-value="$emit('update:pageSize', $event)"
      placeholder="每页条数"
      class="page-size-select"
    >
      <el-option label="20条/页" :value="20" />
      <el-option label="50条/页" :value="50" />
      <el-option label="100条/页" :value="100" />
    </el-select>
    <el-button type="primary" :loading="loading" @click="$emit('query')">
      <el-icon><Search /></el-icon>
      查询
    </el-button>
  </QueryCard>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import QueryCard from '@/component/common/QueryCard.vue'

defineProps<{
  queryDate: string
  pageSize: number
  loading: boolean
  errorMessage: string
}>()

defineEmits<{
  'update:queryDate': [value: string]
  'update:pageSize': [value: number]
  'query': []
  'clear-error': []
}>()
</script>

<style scoped>
.date-picker {
  width: 200px;
}

.page-size-select {
  width: 140px;
}
</style>
