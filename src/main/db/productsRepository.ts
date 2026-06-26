import type Database from 'better-sqlite3'
import type { NewProduct, Product, ProductUpdate } from '@shared/types'

interface ProductRow {
  id: number
  barcode: string | null
  name: string
  brand: string | null
  category: string | null
  price_cents: number
  image_url: string | null
  source: string
  created_at: string
  updated_at: string
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    category: row.category,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    source: row.source as Product['source'],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export interface ProductsRepository {
  list(): Product[]
  findById(id: number): Product | null
  findByBarcode(barcode: string): Product | null
  create(input: NewProduct): Product
  update(id: number, patch: ProductUpdate): Product
  delete(id: number): void
}

export function createProductsRepository(db: Database.Database): ProductsRepository {
  const listStmt = db.prepare('SELECT * FROM products ORDER BY name COLLATE NOCASE')
  const findByIdStmt = db.prepare('SELECT * FROM products WHERE id = ?')
  const findByBarcodeStmt = db.prepare('SELECT * FROM products WHERE barcode = ?')
  const insertStmt = db.prepare(`
    INSERT INTO products (barcode, name, brand, category, price_cents, image_url, source)
    VALUES (@barcode, @name, @brand, @category, @priceCents, @imageUrl, @source)
  `)
  const updateStmt = db.prepare(`
    UPDATE products
    SET barcode = @barcode, name = @name, brand = @brand, category = @category,
        price_cents = @priceCents, image_url = @imageUrl, source = @source,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id
  `)
  const deleteStmt = db.prepare('DELETE FROM products WHERE id = ?')

  return {
    list(): Product[] {
      return (listStmt.all() as ProductRow[]).map(rowToProduct)
    },

    findById(id: number): Product | null {
      const row = findByIdStmt.get(id) as ProductRow | undefined
      return row ? rowToProduct(row) : null
    },

    findByBarcode(barcode: string): Product | null {
      const row = findByBarcodeStmt.get(barcode) as ProductRow | undefined
      return row ? rowToProduct(row) : null
    },

    create(input: NewProduct): Product {
      const result = insertStmt.run({
        barcode: input.barcode,
        name: input.name,
        brand: input.brand,
        category: input.category,
        priceCents: input.priceCents,
        imageUrl: input.imageUrl,
        source: input.source
      })
      const created = findByIdStmt.get(result.lastInsertRowid) as ProductRow
      return rowToProduct(created)
    },

    update(id: number, patch: ProductUpdate): Product {
      const existing = findByIdStmt.get(id) as ProductRow | undefined
      if (!existing) throw new Error(`Product ${id} not found`)
      const merged = { ...rowToProduct(existing), ...patch }
      updateStmt.run({
        id,
        barcode: merged.barcode,
        name: merged.name,
        brand: merged.brand,
        category: merged.category,
        priceCents: merged.priceCents,
        imageUrl: merged.imageUrl,
        source: merged.source
      })
      return rowToProduct(findByIdStmt.get(id) as ProductRow)
    },

    delete(id: number): void {
      deleteStmt.run(id)
    }
  }
}
