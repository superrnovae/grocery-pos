import { BrowserWindow, dialog, ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { IpcChannel } from '@shared/ipc-contract'
import type { BulkImportSummary, NewProduct, ProductUpdate } from '@shared/types'
import type { ProductsRepository } from '../db/productsRepository'
import { importProducts, parseProductsCsv } from '../services/productImportService'

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

  ipcMain.handle(
    IpcChannel.ProductsBulkImport,
    async (event): Promise<BulkImportSummary | null> => {
      const window = BrowserWindow.getFocusedWindow()
      const options = {
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        properties: ['openFile' as const]
      }
      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options)
      if (result.canceled || result.filePaths.length === 0) return null

      const content = await readFile(result.filePaths[0], 'utf-8')
      const { rows, errors } = parseProductsCsv(content)

      const imported = await importProducts(repository, rows, (processed, total) => {
        event.sender.send(IpcChannel.ProductsImportProgress, { processed, total })
      })

      return { total: rows.length, imported, errors }
    }
  )
}
