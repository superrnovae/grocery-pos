import type Database from 'better-sqlite3'
import type { NewSalePayload, Sale, SaleItem } from '@shared/types'
import type { ProductsRepository } from './productsRepository'
import type { SalesListFilter } from '@shared/ipc-contract'

interface SaleRow {
  id: number
  created_at: string
  total_cents: number
}

interface SaleItemRow {
  id: number
  sale_id: number
  product_id: number | null
  product_name_snapshot: string
  unit_price_cents_snapshot: number
  quantity: number
  line_total_cents: number
}

function rowToSaleItem(row: SaleItemRow): SaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    productNameSnapshot: row.product_name_snapshot,
    unitPriceCentsSnapshot: row.unit_price_cents_snapshot,
    quantity: row.quantity,
    lineTotalCents: row.line_total_cents
  }
}

export interface SalesRepository {
  create(payload: NewSalePayload): Sale
  list(filter?: SalesListFilter): Sale[]
  getById(id: number): Sale | null
}

export function createSalesRepository(
  db: Database.Database,
  productsRepository: ProductsRepository
): SalesRepository {
  const insertSaleStmt = db.prepare('INSERT INTO sales (total_cents) VALUES (?)')
  const insertItemStmt = db.prepare(`
    INSERT INTO sale_items
      (sale_id, product_id, product_name_snapshot, unit_price_cents_snapshot, quantity, line_total_cents)
    VALUES (@saleId, @productId, @productNameSnapshot, @unitPriceCentsSnapshot, @quantity, @lineTotalCents)
  `)
  const getSaleStmt = db.prepare('SELECT * FROM sales WHERE id = ?')
  const getItemsStmt = db.prepare('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id')
  const listAllStmt = db.prepare('SELECT * FROM sales ORDER BY created_at DESC')
  const listBetweenStmt = db.prepare(
    'SELECT * FROM sales WHERE created_at >= @from AND created_at <= @to ORDER BY created_at DESC'
  )

  function hydrate(row: SaleRow): Sale {
    const items = (getItemsStmt.all(row.id) as SaleItemRow[]).map(rowToSaleItem)
    return { id: row.id, createdAt: row.created_at, totalCents: row.total_cents, items }
  }

  function hydrateAll(rows: SaleRow[]): Sale[] {
    if (rows.length === 0) return []
    const ids = rows.map((row) => row.id)
    const placeholders = ids.map(() => '?').join(',')
    const itemRows = db
      .prepare(`SELECT * FROM sale_items WHERE sale_id IN (${placeholders}) ORDER BY id`)
      .all(...ids) as SaleItemRow[]

    const itemsBySaleId = new Map<number, SaleItem[]>()
    for (const itemRow of itemRows) {
      const items = itemsBySaleId.get(itemRow.sale_id) ?? []
      items.push(rowToSaleItem(itemRow))
      itemsBySaleId.set(itemRow.sale_id, items)
    }

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      totalCents: row.total_cents,
      items: itemsBySaleId.get(row.id) ?? []
    }))
  }

  const createTx = db.transaction((payload: NewSalePayload): number => {
    if (payload.items.length === 0) throw new Error('Cannot create a sale with no items')

    const lines = payload.items.map(({ productId, quantity }) => {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive integer')
      }
      const product = productsRepository.findById(productId)
      if (!product) throw new Error(`Product ${productId} not found`)
      return {
        productId,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity,
        lineTotalCents: product.priceCents * quantity
      }
    })

    const totalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0)
    const saleId = Number(insertSaleStmt.run(totalCents).lastInsertRowid)

    for (const line of lines) {
      insertItemStmt.run({
        saleId,
        productId: line.productId,
        productNameSnapshot: line.name,
        unitPriceCentsSnapshot: line.unitPriceCents,
        quantity: line.quantity,
        lineTotalCents: line.lineTotalCents
      })
    }

    return saleId
  })

  return {
    create(payload: NewSalePayload): Sale {
      const saleId = createTx(payload)
      return hydrate(getSaleStmt.get(saleId) as SaleRow)
    },

    list(filter: SalesListFilter = {}): Sale[] {
      const rows =
        filter.fromDate || filter.toDate
          ? (listBetweenStmt.all({
              from: filter.fromDate ?? '0000-01-01',
              to: filter.toDate ?? '9999-12-31'
            }) as SaleRow[])
          : (listAllStmt.all() as SaleRow[])
      return hydrateAll(rows)
    },

    getById(id: number): Sale | null {
      const row = getSaleStmt.get(id) as SaleRow | undefined
      return row ? hydrate(row) : null
    }
  }
}
