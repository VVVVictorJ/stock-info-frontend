<template>
  <el-header class="layout-header">
    <span class="title">Stock Info</span>
  </el-header>
</template>

<style scoped>
.layout-header {
  display: flex;
  align-items: center;
  justify-content: left;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  gap: 8px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.title {
  user-select: none;
  color: #303133;
}
</style>
