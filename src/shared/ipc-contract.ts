import type {
  AppSettings,
  BulkImportSummary,
  Customer,
  ImportProgress,
  NewCustomer,
  NewProduct,
  NewSalePayload,
  OpenFoodFactsLookupResult,
  Product,
  ProductUpdate,
  Sale
} from './types'

export const IpcChannel = {
  ProductsList: 'products:list',
  ProductsCreate: 'products:create',
  ProductsUpdate: 'products:update',
  ProductsDelete: 'products:delete',
  ProductsFindByBarcode: 'products:findByBarcode',
  ProductsBulkImport: 'products:bulkImport',
  ProductsImportProgress: 'products:importProgress',
  LookupByBarcode: 'lookup:byBarcode',
  SalesCreate: 'sales:create',
  SalesList: 'sales:list',
  SalesGetById: 'sales:getById',
  CustomersList: 'customers:list',
  CustomersCreate: 'customers:create',
  CustomersFindByPhone: 'customers:findByPhone',
  SettingsGet: 'settings:get',
  SettingsUpdate: 'settings:update',
  ExportSalesCsv: 'export:salesCsv',
  ExportProductsCsv: 'export:productsCsv',
  ExportReceiptPdf: 'export:receiptPdf',
  ExportPrintReceipt: 'export:printReceipt'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

export interface SalesListFilter {
  fromDate?: string
  toDate?: string
  customerId?: number
}

/** Shape exposed on `window.api` by the preload script; implemented 1:1 by main-process IPC handlers. */
export interface IpcApi {
  products: {
    list(): Promise<Product[]>
    create(input: NewProduct): Promise<Product>
    update(id: number, patch: ProductUpdate): Promise<Product>
    delete(id: number): Promise<void>
    findByBarcode(barcode: string): Promise<Product | null>
    bulkImport(): Promise<BulkImportSummary | null>
    onImportProgress(callback: (progress: ImportProgress) => void): () => void
  }
  lookup: {
    byBarcode(barcode: string): Promise<OpenFoodFactsLookupResult>
  }
  sales: {
    create(payload: NewSalePayload): Promise<Sale>
    list(filter: SalesListFilter): Promise<Sale[]>
    getById(id: number): Promise<Sale | null>
  }
  customers: {
    list(): Promise<Customer[]>
    create(input: NewCustomer): Promise<Customer>
    findByPhone(phone: string): Promise<Customer | null>
  }
  settings: {
    get(): Promise<AppSettings>
    update(patch: Partial<AppSettings>): Promise<AppSettings>
  }
  exportApi: {
    salesCsv(filter: SalesListFilter): Promise<string | null>
    productsCsv(): Promise<string | null>
    receiptPdf(saleId: number): Promise<string | null>
    printReceipt(saleId: number): Promise<void>
  }
}
