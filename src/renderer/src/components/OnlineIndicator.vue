<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOnlineStore } from '../stores/online'

const online = useOnlineStore()
const { t } = useI18n()
</script>

<template>
  <span class="online-indicator" :class="{ offline: !online.isOnline }">
    <span class="dot" />
    {{ online.isOnline ? t('common.online') : t('common.offline') }}
  </span>
</template>

<style scoped>
.online-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-soft);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ecc71;
}

.online-indicator.offline .dot {
  background: #e74c3c;
}
</style>
