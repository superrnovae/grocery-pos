<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AcceptableValue } from 'reka-ui'
import { useSettingsStore } from '../stores/settings'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import type { Locale, SyncMode, SyncStatus, Theme } from '@shared/types'

const { t } = useI18n()
const settings = useSettingsStore()

const backupMessage = ref('')
const backingUp = ref(false)
const restoring = ref(false)
const updateMessage = ref('')
const checkingForUpdates = ref(false)

const syncMode = ref<SyncMode>(settings.syncMode)
const syncPort = ref(settings.syncPort)
const syncHost = ref(settings.syncHost)
const syncStatus = ref<SyncStatus | null>(null)
const syncMessage = ref('')
const syncBusy = ref(false)
let statusPoll: ReturnType<typeof setInterval> | null = null

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

async function refreshSyncStatus(): Promise<void> {
  try {
    syncStatus.value = await window.api.sync.getStatus()
  } catch (error) {
    console.error('Failed to get sync status', error)
  }
}

onMounted(() => {
  refreshSyncStatus()
  statusPoll = setInterval(refreshSyncStatus, 5000)
})

onUnmounted(() => {
  if (statusPoll) clearInterval(statusPoll)
})

function onSyncModeChange(value: AcceptableValue | AcceptableValue[]): void {
  if (typeof value === 'string' && value) syncMode.value = value as SyncMode
}

async function applySyncSettings(): Promise<void> {
  syncBusy.value = true
  syncMessage.value = ''
  try {
    if (syncMode.value === 'off') {
      await window.api.sync.stop()
    } else {
      await window.api.sync.start(syncMode.value, { port: syncPort.value, host: syncHost.value })
    }
    settings.syncMode = syncMode.value
    settings.syncPort = syncPort.value
    settings.syncHost = syncHost.value
    await refreshSyncStatus()
  } catch (error) {
    console.error('Failed to apply sync settings', error)
    syncMessage.value = t('settings.sync.error')
  } finally {
    syncBusy.value = false
  }
}

async function syncNow(): Promise<void> {
  syncBusy.value = true
  syncMessage.value = ''
  try {
    await window.api.sync.syncNow()
    await refreshSyncStatus()
  } catch (error) {
    console.error('Sync now failed', error)
    syncMessage.value = t('settings.sync.error')
  } finally {
    syncBusy.value = false
  }
}
</script>

<template>
  <section class="max-w-2xl">
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

    <div class="mt-6">
      <h2 class="text-muted-foreground mb-2 text-sm font-medium">{{ t('settings.sync.title') }}</h2>
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1.5">
          <Label for="sync-mode">{{ t('settings.sync.mode') }}</Label>
          <Select :model-value="syncMode" @update:model-value="onSyncModeChange">
            <SelectTrigger id="sync-mode" class="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{{ t('settings.sync.off') }}</SelectItem>
              <SelectItem value="host">{{ t('settings.sync.host') }}</SelectItem>
              <SelectItem value="client">{{ t('settings.sync.client') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="syncMode !== 'off'" class="flex flex-col gap-1.5">
          <Label for="sync-port">{{ t('settings.sync.port') }}</Label>
          <Input id="sync-port" v-model.number="syncPort" type="number" class="w-24" />
        </div>
        <div v-if="syncMode === 'client'" class="flex flex-col gap-1.5">
          <Label for="sync-host">{{ t('settings.sync.hostAddress') }}</Label>
          <Input
            id="sync-host"
            v-model="syncHost"
            type="text"
            :placeholder="t('settings.sync.hostPlaceholder')"
            class="w-40"
          />
        </div>
        <Button type="button" variant="outline" :disabled="syncBusy" @click="applySyncSettings">
          {{ t('settings.sync.apply') }}
        </Button>
        <Button
          v-if="syncStatus?.mode === 'client'"
          type="button"
          variant="outline"
          :disabled="syncBusy"
          @click="syncNow"
        >
          {{ t('settings.sync.syncNow') }}
        </Button>
      </div>

      <p v-if="syncStatus" class="text-muted-foreground mt-3 text-sm">
        <template v-if="syncStatus.mode === 'off'">{{ t('settings.sync.statusOff') }}</template>
        <template v-else-if="syncStatus.mode === 'host'">
          {{ t('settings.sync.statusHost', { running: syncStatus.running ? '✓' : '✗' }) }}
        </template>
        <template v-else>
          {{
            t('settings.sync.statusClient', {
              lastSyncedAt: syncStatus.lastSyncedAt
                ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString()
                : t('settings.sync.never')
            })
          }}
          <span v-if="syncStatus.lastError" class="text-destructive">
            — {{ syncStatus.lastError }}</span
          >
        </template>
      </p>
      <Alert v-if="syncMessage" variant="destructive" class="mt-3">
        <AlertDescription>{{ syncMessage }}</AlertDescription>
      </Alert>
    </div>
  </section>
</template>
