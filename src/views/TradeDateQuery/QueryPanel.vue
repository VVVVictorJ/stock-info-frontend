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
  loading: boolean
  errorMessage: string
}>()

defineEmits<{
  'update:queryDate': [value: string]
  'query': []
  'clear-error': []
}>()
</script>

<style scoped>
.date-picker {
  width: 200px;
}
</style>
