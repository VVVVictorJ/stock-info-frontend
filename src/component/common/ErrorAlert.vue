<template>
  <el-alert
    v-if="message"
    :title="message"
    type="error"
    show-icon
    :closable="closable"
    class="error-alert"
    @close="handleClose"
  />
</template>

<script setup lang="ts">
defineProps<{
  message: string
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.error-alert {
  margin-bottom: 8px;
}
</style>
