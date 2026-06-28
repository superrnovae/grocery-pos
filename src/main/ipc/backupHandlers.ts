import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { IpcChannel } from '@shared/ipc-contract'
import { createBackup, isValidBackup, restoreBackup } from '../services/backupService'

export function registerBackupHandlers(db: Database.Database, dbFilePath: string): void {
  ipcMain.handle(IpcChannel.BackupCreate, async (event): Promise<boolean> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options = {
      defaultPath: 'grocery-pos-backup.sqlite3',
      filters: [{ name: 'SQLite database', extensions: ['sqlite3'] }]
    }
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return false

    await createBackup(db, result.filePath)
    return true
  })

  ipcMain.handle(IpcChannel.BackupRestore, async (event): Promise<boolean> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options = {
      filters: [{ name: 'SQLite database', extensions: ['sqlite3', 'db'] }],
      properties: ['openFile' as const]
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return false

    const sourcePath = result.filePaths[0]
    if (!isValidBackup(sourcePath)) {
      throw new Error('The selected file is not a valid grocery-pos backup')
    }

    restoreBackup(db, sourcePath, dbFilePath)
    app.relaunch()
    app.exit(0)
    return true
  })
}
