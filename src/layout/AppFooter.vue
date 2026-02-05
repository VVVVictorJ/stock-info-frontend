<script setup lang="ts">
const appVersion = __APP_VERSION__
</script>

<template>
  <footer class="layout-footer">
    <div class="footer-content">
      <span>copyright@2026 · v{{ appVersion }}</span>
    </div>
  </footer>
</template>

<style scoped>
.layout-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 10px 16px;
  flex-shrink: 0;
}
.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #606266;
}
</style>
