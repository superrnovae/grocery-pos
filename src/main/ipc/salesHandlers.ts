import { ipcMain } from 'electron'
import { IpcChannel, type SalesListFilter } from '@shared/ipc-contract'
import type { NewSalePayload } from '@shared/types'
import type { SalesRepository } from '../db/salesRepository'
import type { SettingsRepository } from '../db/settingsRepository'
import { notifySaleCompleted } from '../services/notifications'

function assertValidPayload(payload: unknown): payload is NewSalePayload {
  const candidate = payload as NewSalePayload | undefined
  if (!candidate || !Array.isArray(candidate.items) || candidate.items.length === 0) {
    throw new Error('A sale requires at least one item')
  }
  return true
}

export function registerSalesHandlers(
  repository: SalesRepository,
  settings: SettingsRepository
): void {
  ipcMain.handle(IpcChannel.SalesCreate, (_event, payload: NewSalePayload) => {
    assertValidPayload(payload)
    const sale = repository.create(payload)
    notifySaleCompleted(sale.totalCents, settings.get().locale)
    return sale
  })

  ipcMain.handle(IpcChannel.SalesList, (_event, filter: SalesListFilter = {}) =>
    repository.list(filter)
  )

  ipcMain.handle(IpcChannel.SalesGetById, (_event, id: unknown) => {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw new Error('id must be an integer')
    }
    return repository.getById(id)
  })
}
