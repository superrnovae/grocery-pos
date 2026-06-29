import type Database from 'better-sqlite3'

export interface SyncProductRow {
  uuid: string
  barcode: string | null
  name: string
  brand: string | null
  category: string | null
  priceCents: number
  imageUrl: string | null
  source: string
  updatedAt: string
}

export interface SyncSaleItemRow {
  productNameSnapshot: string
  unitPriceCentsSnapshot: number
  quantity: number
  lineTotalCents: number
}

export interface SyncSaleRow {
  uuid: string
  createdAt: string
  totalCents: number
  discountCents: number
  items: SyncSaleItemRow[]
}

export interface SyncSnapshot {
  products: SyncProductRow[]
  sales: SyncSaleRow[]
}

export interface SyncRepository {
  /** Rows changed since the given ISO timestamp (products by updated_at, sales by created_at — sales never change after creation). */
  getChangesSince(since: string): SyncSnapshot
  /** Upserts incoming rows by uuid: products last-write-wins on updated_at, sales insert-only (immutable). */
  applyChanges(snapshot: SyncSnapshot): void
}

interface ProductDbRow {
  uuid: string
  barcode: string | null
  name: string
  brand: string | null
  category: string | null
  price_cents: number
  image_url: string | null
  source: string
  updated_at: string
}

interface SaleDbRow {
  id: number
  uuid: string
  created_at: string
  total_cents: number
  discount_cents: number
}

interface SaleItemDbRow {
  product_name_snapshot: string
  unit_price_cents_snapshot: number
  quantity: number
  line_total_cents: number
}

export function createSyncRepository(db: Database.Database): SyncRepository {
  const productsSinceStmt = db.prepare(`
    SELECT uuid, barcode, name, brand, category, price_cents, image_url, source, updated_at
    FROM products
    WHERE uuid IS NOT NULL AND updated_at > @since
  `)
  const salesSinceStmt = db.prepare(`
    SELECT id, uuid, created_at, total_cents, discount_cents
    FROM sales
    WHERE uuid IS NOT NULL AND created_at > @since
  `)
  const saleItemsStmt = db.prepare(`
    SELECT product_name_snapshot, unit_price_cents_snapshot, quantity, line_total_cents
    FROM sale_items
    WHERE sale_id = ?
  `)

  const upsertProductStmt = db.prepare(`
    INSERT INTO products (uuid, barcode, name, brand, category, price_cents, image_url, source, updated_at)
    VALUES (@uuid, @barcode, @name, @brand, @category, @priceCents, @imageUrl, @source, @updatedAt)
    ON CONFLICT(uuid) DO UPDATE SET
      barcode = excluded.barcode,
      name = excluded.name,
      brand = excluded.brand,
      category = excluded.category,
      price_cents = excluded.price_cents,
      image_url = excluded.image_url,
      source = excluded.source,
      updated_at = excluded.updated_at
    WHERE excluded.updated_at > products.updated_at
  `)
  const insertSaleStmt = db.prepare(`
    INSERT INTO sales (uuid, created_at, total_cents, discount_cents)
    VALUES (@uuid, @createdAt, @totalCents, @discountCents)
    ON CONFLICT(uuid) DO NOTHING
  `)
  const insertSaleItemStmt = db.prepare(`
    INSERT INTO sale_items
      (sale_id, product_id, product_name_snapshot, unit_price_cents_snapshot, quantity, line_total_cents)
    VALUES (@saleId, NULL, @productNameSnapshot, @unitPriceCentsSnapshot, @quantity, @lineTotalCents)
  `)

  const applyChangesTx = db.transaction((snapshot: SyncSnapshot): void => {
    for (const product of snapshot.products) {
      try {
        upsertProductStmt.run({
          uuid: product.uuid,
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          category: product.category,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          source: product.source,
          updatedAt: product.updatedAt
        })
      } catch (error) {
        // A barcode collision between two independently-seeded catalogs is the one conflict
        // this simple sync doesn't resolve; skip that row rather than aborting the whole batch.
        console.error('Sync: failed to apply product', product.uuid, error)
      }
    }

    for (const sale of snapshot.sales) {
      const result = insertSaleStmt.run({
        uuid: sale.uuid,
        createdAt: sale.createdAt,
        totalCents: sale.totalCents,
        discountCents: sale.discountCents
      })
      if (result.changes === 1) {
        const saleId = Number(result.lastInsertRowid)
        for (const item of sale.items) {
          insertSaleItemStmt.run({ saleId, ...item })
        }
      }
    }
  })

  return {
    getChangesSince(since: string): SyncSnapshot {
      const products = (productsSinceStmt.all({ since }) as ProductDbRow[]).map((row) => ({
        uuid: row.uuid,
        barcode: row.barcode,
        name: row.name,
        brand: row.brand,
        category: row.category,
        priceCents: row.price_cents,
        imageUrl: row.image_url,
        source: row.source,
        updatedAt: row.updated_at
      }))

      const saleRows = salesSinceStmt.all({ since }) as SaleDbRow[]
      const sales = saleRows.map((row) => ({
        uuid: row.uuid,
        createdAt: row.created_at,
        totalCents: row.total_cents,
        discountCents: row.discount_cents,
        items: (saleItemsStmt.all(row.id) as SaleItemDbRow[]).map((item) => ({
          productNameSnapshot: item.product_name_snapshot,
          unitPriceCentsSnapshot: item.unit_price_cents_snapshot,
          quantity: item.quantity,
          lineTotalCents: item.line_total_cents
        }))
      }))

      return { products, sales }
    },

    applyChanges(snapshot: SyncSnapshot): void {
      applyChangesTx(snapshot)
    }
  }
}
