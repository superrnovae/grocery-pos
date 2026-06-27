import { BrowserWindow, dialog, ipcMain } from 'electron'
import { writeFile } from 'fs/promises'
import { IpcChannel, type SalesListFilter } from '@shared/ipc-contract'
import type { ProductsRepository } from '../db/productsRepository'
import type { SalesRepository } from '../db/salesRepository'
import type { SettingsRepository } from '../db/settingsRepository'
import { buildProductsCsv, buildSalesCsv, renderReceiptPdf } from '../services/exportService'

async function saveToFile(
  defaultPath: string,
  filters: Electron.FileFilter[],
  data: string | Buffer
): Promise<string | null> {
  const window = BrowserWindow.getFocusedWindow()
  const options = { defaultPath, filters }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return null
  await writeFile(result.filePath, data)
  return result.filePath
}

export function registerExportHandlers(
  productsRepository: ProductsRepository,
  salesRepository: SalesRepository,
  settingsRepository: SettingsRepository
): void {
  ipcMain.handle(IpcChannel.ExportProductsCsv, async () => {
    const csv = buildProductsCsv(productsRepository.list())
    return saveToFile('products.csv', [{ name: 'CSV', extensions: ['csv'] }], csv)
  })

  ipcMain.handle(IpcChannel.ExportSalesCsv, async (_event, filter: SalesListFilter = {}) => {
    const csv = buildSalesCsv(salesRepository.list(filter))
    return saveToFile('sales.csv', [{ name: 'CSV', extensions: ['csv'] }], csv)
  })

  ipcMain.handle(IpcChannel.ExportReceiptPdf, async (_event, saleId: unknown) => {
    if (typeof saleId !== 'number' || !Number.isInteger(saleId)) {
      throw new Error('saleId must be an integer')
    }
    const sale = salesRepository.getById(saleId)
    if (!sale) throw new Error(`Sale ${saleId} not found`)
    const pdf = await renderReceiptPdf(sale, settingsRepository.get().locale)
    return saveToFile(`receipt-${sale.id}.pdf`, [{ name: 'PDF', extensions: ['pdf'] }], pdf)
  })
}
