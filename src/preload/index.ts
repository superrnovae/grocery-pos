import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, type IpcApi } from '../shared/ipc-contract'
import type { ImportProgress } from '../shared/types'

const api: IpcApi = {
  products: {
    list: () => ipcRenderer.invoke(IpcChannel.ProductsList),
    create: (input) => ipcRenderer.invoke(IpcChannel.ProductsCreate, input),
    update: (id, patch) => ipcRenderer.invoke(IpcChannel.ProductsUpdate, id, patch),
    delete: (id) => ipcRenderer.invoke(IpcChannel.ProductsDelete, id),
    findByBarcode: (barcode) => ipcRenderer.invoke(IpcChannel.ProductsFindByBarcode, barcode),
    bulkImport: () => ipcRenderer.invoke(IpcChannel.ProductsBulkImport),
    onImportProgress: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, progress: ImportProgress): void =>
        callback(progress)
      ipcRenderer.on(IpcChannel.ProductsImportProgress, listener)
      return () => ipcRenderer.removeListener(IpcChannel.ProductsImportProgress, listener)
    }
  },
  lookup: {
    byBarcode: (barcode) => ipcRenderer.invoke(IpcChannel.LookupByBarcode, barcode)
  },
  sales: {
    create: (payload) => ipcRenderer.invoke(IpcChannel.SalesCreate, payload),
    list: (filter) => ipcRenderer.invoke(IpcChannel.SalesList, filter),
    getById: (id) => ipcRenderer.invoke(IpcChannel.SalesGetById, id)
  },
  customers: {
    list: () => ipcRenderer.invoke(IpcChannel.CustomersList),
    create: (input) => ipcRenderer.invoke(IpcChannel.CustomersCreate, input),
    findByPhone: (phone) => ipcRenderer.invoke(IpcChannel.CustomersFindByPhone, phone)
  },
  analytics: {
    getDashboardStats: () => ipcRenderer.invoke(IpcChannel.AnalyticsGetDashboardStats)
  },
  orders: {
    create: (payload) => ipcRenderer.invoke(IpcChannel.OrdersCreate, payload),
    list: () => ipcRenderer.invoke(IpcChannel.OrdersList),
    getById: (id) => ipcRenderer.invoke(IpcChannel.OrdersGetById, id),
    updateStatus: (id, status) => ipcRenderer.invoke(IpcChannel.OrdersUpdateStatus, id, status)
  },
  backup: {
    create: () => ipcRenderer.invoke(IpcChannel.BackupCreate),
    restore: () => ipcRenderer.invoke(IpcChannel.BackupRestore)
  },
  updates: {
    check: () => ipcRenderer.invoke(IpcChannel.UpdatesCheck)
  },
  settings: {
    get: () => ipcRenderer.invoke(IpcChannel.SettingsGet),
    update: (patch) => ipcRenderer.invoke(IpcChannel.SettingsUpdate, patch)
  },
  exportApi: {
    salesCsv: (filter) => ipcRenderer.invoke(IpcChannel.ExportSalesCsv, filter),
    productsCsv: () => ipcRenderer.invoke(IpcChannel.ExportProductsCsv),
    receiptPdf: (saleId) => ipcRenderer.invoke(IpcChannel.ExportReceiptPdf, saleId),
    printReceipt: (saleId) => ipcRenderer.invoke(IpcChannel.ExportPrintReceipt, saleId)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
