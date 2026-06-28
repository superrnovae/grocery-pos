<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AcceptableValue } from 'reka-ui'
import { useSettingsStore } from '../stores/settings'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import type { Locale, Theme } from '@shared/types'

const { t } = useI18n()
const settings = useSettingsStore()

function onThemeChange(value: AcceptableValue | AcceptableValue[]): void {
  if (typeof value === 'string' && value) settings.setTheme(value as Theme)
}

function onLocaleChange(value: AcceptableValue | AcceptableValue[]): void {
  if (typeof value === 'string' && value) settings.setLocale(value as Locale)
}
</script>

<template>
  <section class="max-w-md">
    <h1 class="mb-6 text-xl font-bold">{{ t('nav.settings') }}</h1>

    <div class="mb-6">
      <h2 class="text-muted-foreground mb-2 text-sm font-medium">{{ t('settings.theme') }}</h2>
      <ToggleGroup
        type="single"
        variant="outline"
        :model-value="settings.theme"
        @update:model-value="onThemeChange"
      >
        <ToggleGroupItem value="light">{{ t('theme.light') }}</ToggleGroupItem>
        <ToggleGroupItem value="dark">{{ t('theme.dark') }}</ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div>
      <h2 class="text-muted-foreground mb-2 text-sm font-medium">{{ t('settings.language') }}</h2>
      <ToggleGroup
        type="single"
        variant="outline"
        :model-value="settings.locale"
        @update:model-value="onLocaleChange"
      >
        <ToggleGroupItem value="fr">{{ t('language.fr') }}</ToggleGroupItem>
        <ToggleGroupItem value="en">{{ t('language.en') }}</ToggleGroupItem>
      </ToggleGroup>
    </div>
  </section>
</template>
