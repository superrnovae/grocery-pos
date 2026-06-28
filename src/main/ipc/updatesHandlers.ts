import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import { checkForUpdates } from '../services/updateService'

export function registerUpdatesHandlers(): void {
  ipcMain.handle(IpcChannel.UpdatesCheck, () => checkForUpdates())
}
