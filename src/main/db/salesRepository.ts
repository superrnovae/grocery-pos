import type Database from 'better-sqlite3'
import type { NewSalePayload, Sale, SaleItem } from '@shared/types'
import type { ProductsRepository } from './productsRepository'
import type { CustomersRepository } from './customersRepository'
import type { SalesListFilter } from '@shared/ipc-contract'

/** Points must be redeemed in multiples of 100 (100 points = €1 off, i.e. 1 point = 1 cent). */
const POINTS_REDEMPTION_STEP = 100

interface SaleRow {
  id: number
  created_at: string
  total_cents: number
  discount_cents: number
  customer_id: number | null
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
  productsRepository: ProductsRepository,
  customersRepository: CustomersRepository
): SalesRepository {
  const insertSaleStmt = db.prepare(`
    INSERT INTO sales (total_cents, discount_cents, customer_id)
    VALUES (@totalCents, @discountCents, @customerId)
  `)
  const insertItemStmt = db.prepare(`
    INSERT INTO sale_items
      (sale_id, product_id, product_name_snapshot, unit_price_cents_snapshot, quantity, line_total_cents)
    VALUES (@saleId, @productId, @productNameSnapshot, @unitPriceCentsSnapshot, @quantity, @lineTotalCents)
  `)
  const getSaleStmt = db.prepare('SELECT * FROM sales WHERE id = ?')
  const getItemsStmt = db.prepare('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id')

  function rowToSale(row: SaleRow, items: SaleItem[]): Sale {
    return {
      id: row.id,
      createdAt: row.created_at,
      totalCents: row.total_cents,
      discountCents: row.discount_cents,
      customerId: row.customer_id,
      items
    }
  }

  function hydrate(row: SaleRow): Sale {
    return rowToSale(row, (getItemsStmt.all(row.id) as SaleItemRow[]).map(rowToSaleItem))
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

    return rows.map((row) => rowToSale(row, itemsBySaleId.get(row.id) ?? []))
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

    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0)

    const customer =
      payload.customerId != null ? customersRepository.findById(payload.customerId) : null
    if (payload.customerId != null && !customer) {
      throw new Error(`Customer ${payload.customerId} not found`)
    }

    const requestedPoints = payload.redeemPoints ?? 0
    let pointsToDeduct = 0
    let discountCents = 0
    if (requestedPoints > 0) {
      if (!customer) throw new Error('Cannot redeem points without a customer')
      if (requestedPoints % POINTS_REDEMPTION_STEP !== 0) {
        throw new Error(`Points must be redeemed in multiples of ${POINTS_REDEMPTION_STEP}`)
      }
      if (requestedPoints > customer.points) throw new Error('Not enough points to redeem')
      discountCents = Math.min(requestedPoints, subtotalCents)
      pointsToDeduct = discountCents
    }

    const totalCents = subtotalCents - discountCents
    const saleId = Number(
      insertSaleStmt.run({
        totalCents,
        discountCents,
        customerId: customer?.id ?? null
      }).lastInsertRowid
    )

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

    if (customer) {
      const earnedPoints = Math.floor(totalCents / 100)
      customersRepository.addPoints(customer.id, earnedPoints - pointsToDeduct)
    }

    return saleId
  })

  return {
    create(payload: NewSalePayload): Sale {
      const saleId = createTx(payload)
      return hydrate(getSaleStmt.get(saleId) as SaleRow)
    },

    list(filter: SalesListFilter = {}): Sale[] {
      const conditions: string[] = []
      const params: Record<string, unknown> = {}
      if (filter.fromDate) {
        conditions.push('created_at >= @fromDate')
        params.fromDate = filter.fromDate
      }
      if (filter.toDate) {
        conditions.push('created_at <= @toDate')
        params.toDate = filter.toDate
      }
      if (filter.customerId != null) {
        conditions.push('customer_id = @customerId')
        params.customerId = filter.customerId
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const rows = db
        .prepare(`SELECT * FROM sales ${where} ORDER BY created_at DESC`)
        .all(params) as SaleRow[]
      return hydrateAll(rows)
    },

    getById(id: number): Sale | null {
      const row = getSaleStmt.get(id) as SaleRow | undefined
      return row ? hydrate(row) : null
    }
  }
}
