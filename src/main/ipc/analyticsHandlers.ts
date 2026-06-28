import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import type { AnalyticsRepository } from '../db/analyticsRepository'

export function registerAnalyticsHandlers(repository: AnalyticsRepository): void {
  ipcMain.handle(IpcChannel.AnalyticsGetDashboardStats, () => repository.getDashboardStats())
}
