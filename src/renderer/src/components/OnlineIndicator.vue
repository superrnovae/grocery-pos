<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Wifi, WifiOff } from '@lucide/vue'
import { useOnlineStore } from '../stores/online'
import { Badge } from './ui/badge'

const online = useOnlineStore()
const { t } = useI18n()
</script>

<template>
  <Badge :variant="online.isOnline ? 'secondary' : 'destructive'">
    <Wifi v-if="online.isOnline" class="size-3" />
    <WifiOff v-else class="size-3" />
    {{ online.isOnline ? t('common.online') : t('common.offline') }}
  </Badge>
</template>
