<template>
  <el-card class="result-card">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <span>{{ title }}</span>
          <slot name="header-info"></slot>
        </div>
        <div class="header-right">
          <slot name="header-right"></slot>
        </div>
      </div>
    </template>
    <slot></slot>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.result-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
}

.result-card :deep(.el-card__header) {
  flex-shrink: 0;
}

.result-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>
