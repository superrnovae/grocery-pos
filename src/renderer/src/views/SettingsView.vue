<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settings'

const { t } = useI18n()
const settings = useSettingsStore()
</script>

<template>
  <section class="settings-view">
    <h1>{{ t('nav.settings') }}</h1>

    <div class="settings-group">
      <h2>{{ t('settings.theme') }}</h2>
      <div class="options">
        <button
          type="button"
          :class="{ active: settings.theme === 'light' }"
          @click="settings.setTheme('light')"
        >
          {{ t('theme.light') }}
        </button>
        <button
          type="button"
          :class="{ active: settings.theme === 'dark' }"
          @click="settings.setTheme('dark')"
        >
          {{ t('theme.dark') }}
        </button>
      </div>
    </div>

    <div class="settings-group">
      <h2>{{ t('settings.language') }}</h2>
      <div class="options">
        <button
          type="button"
          :class="{ active: settings.locale === 'fr' }"
          @click="settings.setLocale('fr')"
        >
          {{ t('language.fr') }}
        </button>
        <button
          type="button"
          :class="{ active: settings.locale === 'en' }"
          @click="settings.setLocale('en')"
        >
          {{ t('language.en') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-group {
  margin-bottom: 24px;
}

.settings-group h2 {
  font-size: 14px;
  color: var(--color-text-soft);
  margin-bottom: 8px;
}

.options {
  display: flex;
  gap: 8px;
}

.options button.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-contrast);
}
</style>
