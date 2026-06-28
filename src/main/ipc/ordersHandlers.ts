import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import type { NewOrderPayload, OrderStatus } from '@shared/types'
import type { OrdersRepository } from '../db/ordersRepository'
import type { SettingsRepository } from '../db/settingsRepository'
import { notifyOrderReady } from '../services/notifications'

const VALID_STATUSES: OrderStatus[] = ['pending', 'in_progress', 'delivered']

function assertValidPayload(payload: unknown): payload is NewOrderPayload {
  const candidate = payload as NewOrderPayload | undefined
  if (!candidate || typeof candidate.customerName !== 'string' || !candidate.customerName.trim()) {
    throw new Error('A customer name is required')
  }
  if (!Array.isArray(candidate.items) || candidate.items.length === 0) {
    throw new Error('An order requires at least one item')
  }
  return true
}

function assertValidId(id: unknown): asserts id is number {
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    throw new Error('id must be an integer')
  }
}

function assertValidStatus(status: unknown): asserts status is OrderStatus {
  if (typeof status !== 'string' || !VALID_STATUSES.includes(status as OrderStatus)) {
    throw new Error('Invalid order status')
  }
}

export function registerOrdersHandlers(
  repository: OrdersRepository,
  settings: SettingsRepository
): void {
  ipcMain.handle(IpcChannel.OrdersCreate, (_event, payload: NewOrderPayload) => {
    assertValidPayload(payload)
    return repository.create(payload)
  })

  ipcMain.handle(IpcChannel.OrdersList, () => repository.list())

  ipcMain.handle(IpcChannel.OrdersGetById, (_event, id: unknown) => {
    assertValidId(id)
    return repository.getById(id)
  })

  ipcMain.handle(IpcChannel.OrdersUpdateStatus, (_event, id: unknown, status: unknown) => {
    assertValidId(id)
    assertValidStatus(status)
    const order = repository.updateStatus(id, status)
    if (status === 'delivered') {
      notifyOrderReady(order.customerName, settings.get().locale)
    }
    return order
  })
}
