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
  items: SaleItem[]
}

export interface CartLine {
  product: Product
  quantity: number
}

export interface NewSalePayload {
  items: { productId: number; quantity: number }[]
}

export type Theme = 'light' | 'dark'
export type Locale = 'fr' | 'en'

export interface AppSettings {
  theme: Theme
  locale: Locale
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
