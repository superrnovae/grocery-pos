<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ id: string }>()
const { t } = useI18n()
</script>

<template>
  <section class="view-placeholder">
    <h1>{{ t('nav.history') }} #{{ id }}</h1>
    <p>{{ t('common.comingSoon') }}</p>
  </section>
</template>
