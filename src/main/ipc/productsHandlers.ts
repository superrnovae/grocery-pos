import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import type { NewProduct, ProductUpdate } from '@shared/types'
import type { ProductsRepository } from '../db/productsRepository'

function assertValidName(name: unknown): void {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('name is required')
  }
}

function assertValidPrice(priceCents: unknown): void {
  if (typeof priceCents !== 'number' || !Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error('priceCents must be a positive integer')
  }
}

function assertValidId(id: unknown): asserts id is number {
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    throw new Error('id must be an integer')
  }
}

export function registerProductsHandlers(repository: ProductsRepository): void {
  ipcMain.handle(IpcChannel.ProductsList, () => repository.list())

  ipcMain.handle(IpcChannel.ProductsFindByBarcode, (_event, barcode: unknown) => {
    if (typeof barcode !== 'string' || barcode.trim().length === 0) {
      throw new Error('barcode is required')
    }
    return repository.findByBarcode(barcode)
  })

  ipcMain.handle(IpcChannel.ProductsCreate, (_event, input: NewProduct) => {
    assertValidName(input?.name)
    assertValidPrice(input?.priceCents)
    return repository.create(input)
  })

  ipcMain.handle(IpcChannel.ProductsUpdate, (_event, id: unknown, patch: ProductUpdate) => {
    assertValidId(id)
    if (patch.priceCents !== undefined) assertValidPrice(patch.priceCents)
    if (patch.name !== undefined) assertValidName(patch.name)
    return repository.update(id, patch)
  })

  ipcMain.handle(IpcChannel.ProductsDelete, (_event, id: unknown) => {
    assertValidId(id)
    repository.delete(id)
  })
}
