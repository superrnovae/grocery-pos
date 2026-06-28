<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AcceptableValue } from 'reka-ui'
import { useSettingsStore } from '../stores/settings'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import type { Locale, Theme } from '@shared/types'

const { t } = useI18n()
const settings = useSettingsStore()

const backupMessage = ref('')
const backingUp = ref(false)
const restoring = ref(false)
const updateMessage = ref('')
const checkingForUpdates = ref(false)

function onThemeChange(value: AcceptableValue | AcceptableValue[]): void {
  if (typeof value === 'string' && value) settings.setTheme(value as Theme)
}

function onLocaleChange(value: AcceptableValue | AcceptableValue[]): void {
  if (typeof value === 'string' && value) settings.setLocale(value as Locale)
}

async function createBackup(): Promise<void> {
  backingUp.value = true
  backupMessage.value = ''
  try {
    const done = await window.api.backup.create()
    if (done) backupMessage.value = t('settings.backup.created')
  } catch (error) {
    console.error('Backup failed', error)
    backupMessage.value = t('settings.backup.createError')
  } finally {
    backingUp.value = false
  }
}

async function restoreBackup(): Promise<void> {
  if (!window.confirm(t('settings.backup.confirmRestore'))) return
  restoring.value = true
  backupMessage.value = ''
  try {
    await window.api.backup.restore()
  } catch (error) {
    console.error('Restore failed', error)
    backupMessage.value = t('settings.backup.restoreError')
    restoring.value = false
  }
}

async function checkForUpdates(): Promise<void> {
  checkingForUpdates.value = true
  updateMessage.value = t('settings.updates.checking')
  try {
    await window.api.updates.check()
  } catch (error) {
    console.error('Update check failed', error)
  } finally {
    checkingForUpdates.value = false
  }
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

    <div class="mb-6">
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

    <div>
      <h2 class="text-muted-foreground mb-2 text-sm font-medium">
        {{ t('settings.backup.title') }}
      </h2>
      <div class="flex gap-2">
        <Button type="button" variant="outline" :disabled="backingUp" @click="createBackup">
          {{ t('settings.backup.create') }}
        </Button>
        <Button type="button" variant="outline" :disabled="restoring" @click="restoreBackup">
          {{ t('settings.backup.restore') }}
        </Button>
      </div>
      <Alert v-if="backupMessage" class="mt-3">
        <AlertDescription>{{ backupMessage }}</AlertDescription>
      </Alert>
    </div>

    <div class="mt-6">
      <h2 class="text-muted-foreground mb-2 text-sm font-medium">
        {{ t('settings.updates.title') }}
      </h2>
      <Button
        type="button"
        variant="outline"
        :disabled="checkingForUpdates"
        @click="checkForUpdates"
      >
        {{ t('settings.updates.check') }}
      </Button>
      <Alert v-if="updateMessage" class="mt-3">
        <AlertDescription>{{ updateMessage }}</AlertDescription>
      </Alert>
    </div>
  </section>
</template>
