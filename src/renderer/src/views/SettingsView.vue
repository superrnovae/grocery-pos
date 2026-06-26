<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section class="view-placeholder">
    <h1>{{ t('nav.settings') }}</h1>
    <p>{{ t('common.comingSoon') }}</p>
  </section>
</template>
