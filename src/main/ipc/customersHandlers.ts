import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import type { NewCustomer } from '@shared/types'
import type { CustomersRepository } from '../db/customersRepository'

export function registerCustomersHandlers(repository: CustomersRepository): void {
  ipcMain.handle(IpcChannel.CustomersList, () => repository.list())

  ipcMain.handle(IpcChannel.CustomersCreate, (_event, input: NewCustomer) => {
    if (typeof input?.name !== 'string' || input.name.trim().length === 0) {
      throw new Error('name is required')
    }
    return repository.create({ name: input.name.trim(), phone: input.phone?.trim() || null })
  })

  ipcMain.handle(IpcChannel.CustomersFindByPhone, (_event, phone: unknown) => {
    if (typeof phone !== 'string' || phone.trim().length === 0) {
      throw new Error('phone is required')
    }
    return repository.findByPhone(phone.trim())
  })
}
