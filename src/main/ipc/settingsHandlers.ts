import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import type { AppSettings } from '@shared/types'
import type { SettingsRepository } from '../db/settingsRepository'

const VALID_THEMES: AppSettings['theme'][] = ['light', 'dark']
const VALID_LOCALES: AppSettings['locale'][] = ['fr', 'en']

export function registerSettingsHandlers(repository: SettingsRepository): void {
  ipcMain.handle(IpcChannel.SettingsGet, () => repository.get())

  ipcMain.handle(IpcChannel.SettingsUpdate, (_event, patch: Partial<AppSettings>) => {
    if (patch.theme !== undefined && !VALID_THEMES.includes(patch.theme)) {
      throw new Error(`Invalid theme: ${patch.theme}`)
    }
    if (patch.locale !== undefined && !VALID_LOCALES.includes(patch.locale)) {
      throw new Error(`Invalid locale: ${patch.locale}`)
    }
    return repository.update(patch)
  })
}
