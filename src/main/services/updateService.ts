import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { Locale } from '@shared/types'
import { notifyUpdateAvailable, notifyUpdateDownloaded } from './notifications'

/** Wires electron-updater's events to system notifications. Call once at startup. */
export function initAutoUpdater(getLocale: () => Locale): void {
  autoUpdater.autoDownload = true

  autoUpdater.on('update-available', (info) => {
    notifyUpdateAvailable(info.version, getLocale())
  })

  autoUpdater.on('update-downloaded', (info) => {
    notifyUpdateDownloaded(info.version, getLocale())
  })

  autoUpdater.on('error', (error) => {
    console.error('Auto-update check failed', error)
  })
}

/** electron-updater requires a packaged app (with app-update.yml); this is a no-op in dev. */
export function checkForUpdates(): void {
  if (!app.isPackaged) {
    console.warn('Skipping update check: app is not packaged')
    return
  }
  autoUpdater.checkForUpdates().catch((error: unknown) => {
    console.error('checkForUpdates failed', error)
  })
}
