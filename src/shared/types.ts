export type ProductSource = 'openfoodfacts' | 'manual'

export interface Product {
  id: number
  barcode: string | null
  name: string
  brand: string | null
  category: string | null
  priceCents: number
  imageUrl: string | null
  source: ProductSource
  createdAt: string
  updatedAt: string
}

export type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
export type ProductUpdate = Partial<NewProduct>

export interface SaleItem {
  id: number
  saleId: number
  productId: number | null
  productNameSnapshot: string
  unitPriceCentsSnapshot: number
  quantity: number
  lineTotalCents: number
}

export interface Sale {
  id: number
  createdAt: string
  totalCents: number
  discountCents: number
  customerId: number | null
  items: SaleItem[]
}

export interface CartLine {
  product: Product
  quantity: number
}

export interface NewSalePayload {
  items: { productId: number; quantity: number }[]
  customerId?: number | null
  redeemPoints?: number
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  points: number
  createdAt: string
  updatedAt: string
}

export type NewCustomer = Pick<Customer, 'name' | 'phone'>

export interface TopProduct {
  name: string
  quantity: number
}

export interface DashboardStats {
  todayRevenueCents: number
  yesterdayRevenueCents: number
  topProducts: TopProduct[]
}

export type OrderStatus = 'pending' | 'in_progress' | 'delivered'

export interface OrderItem {
  id: number
  orderId: number
  productId: number | null
  productNameSnapshot: string
  unitPriceCentsSnapshot: number
  quantity: number
  lineTotalCents: number
}

export interface Order {
  id: number
  customerName: string
  customerPhone: string | null
  status: OrderStatus
  totalCents: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export interface NewOrderPayload {
  customerName: string
  customerPhone?: string | null
  items: { productId: number; quantity: number }[]
}

export type Theme = 'light' | 'dark'
export type Locale = 'fr' | 'en'
export type SyncMode = 'off' | 'host' | 'client'

export interface AppSettings {
  theme: Theme
  locale: Locale
  syncMode: SyncMode
  /** Port the host listens on (host mode) or connects to (client mode). */
  syncPort: number
  /** Host machine address to connect to, e.g. "192.168.1.20" (client mode only). */
  syncHost: string
}

export interface SyncStatus {
  mode: SyncMode
  running: boolean
  lastSyncedAt: string | null
  lastError: string | null
}

export interface BulkImportSummary {
  total: number
  imported: number
  errors: string[]
}

export interface ImportProgress {
  processed: number
  total: number
}

export interface OpenFoodFactsLookupResult {
  found: boolean
  product?: {
    barcode: string
    name: string | null
    brand: string | null
    category: string | null
    imageUrl: string | null
  }
}
