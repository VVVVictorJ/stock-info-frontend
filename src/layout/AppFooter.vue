<template>
  <footer class="layout-footer">
    <div class="footer-content">
      <span>copyright@2026 · v{{ __APP_VERSION__ }}</span>
    </div>
  </footer>
</template>

<style scoped>
.layout-footer {
  border-top: 1px solid var(--el-border-color);
  background: #fff;
  padding: 10px 16px;
  flex-shrink: 0;
}
.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
}
</style>
