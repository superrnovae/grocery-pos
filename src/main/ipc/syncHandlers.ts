import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import type { SyncMode } from '@shared/types'
import type { SettingsRepository } from '../db/settingsRepository'
import type { SyncController } from '../services/syncService'

function assertValidMode(mode: unknown): asserts mode is SyncMode {
  if (mode !== 'off' && mode !== 'host' && mode !== 'client') {
    throw new Error('Invalid sync mode')
  }
}

export function registerSyncHandlers(
  controller: SyncController,
  settings: SettingsRepository
): void {
  ipcMain.handle(
    IpcChannel.SyncStart,
    (_event, mode: unknown, options: { port: number; host: string }) => {
      assertValidMode(mode)
      settings.update({ syncMode: mode, syncPort: options.port, syncHost: options.host })
      controller.start(mode, options)
    }
  )

  ipcMain.handle(IpcChannel.SyncStop, () => {
    settings.update({ syncMode: 'off' })
    controller.stop()
  })

  ipcMain.handle(IpcChannel.SyncNow, () => controller.syncNow())

  ipcMain.handle(IpcChannel.SyncGetStatus, () => controller.getStatus())
}
