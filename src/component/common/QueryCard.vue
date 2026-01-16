<template>
  <el-card class="query-card">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
      </div>
    </template>
    <div class="query-form">
      <slot></slot>
    </div>
    <ErrorAlert
      v-if="errorMessage"
      :message="errorMessage"
      :closable="closable"
      class="error-alert-margin"
      @close="$emit('clear-error')"
    />
  </el-card>
</template>

<script setup lang="ts">
import ErrorAlert from './ErrorAlert.vue'

defineProps<{
  title: string
  errorMessage?: string
  closable?: boolean
}>()

defineEmits<{
  'clear-error': []
}>()
</script>

<style scoped>
.query-card {
  flex-shrink: 0;
  flex-basis: auto;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: visible;
}

.query-card :deep(.el-card__header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.query-card :deep(.el-card__body) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0 0 4px 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.query-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.error-alert-margin {
  margin-top: 12px;
}
</style>
