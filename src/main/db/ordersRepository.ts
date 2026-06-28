import type Database from 'better-sqlite3'
import type { NewOrderPayload, Order, OrderItem, OrderStatus } from '@shared/types'
import type { ProductsRepository } from './productsRepository'

interface OrderRow {
  id: number
  customer_name: string
  customer_phone: string | null
  status: OrderStatus
  total_cents: number
  created_at: string
  updated_at: string
}

interface OrderItemRow {
  id: number
  order_id: number
  product_id: number | null
  product_name_snapshot: string
  unit_price_cents_snapshot: number
  quantity: number
  line_total_cents: number
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productNameSnapshot: row.product_name_snapshot,
    unitPriceCentsSnapshot: row.unit_price_cents_snapshot,
    quantity: row.quantity,
    lineTotalCents: row.line_total_cents
  }
}

export interface OrdersRepository {
  create(payload: NewOrderPayload): Order
  list(): Order[]
  getById(id: number): Order | null
  updateStatus(id: number, status: OrderStatus): Order
}

export function createOrdersRepository(
  db: Database.Database,
  productsRepository: ProductsRepository
): OrdersRepository {
  const insertOrderStmt = db.prepare(`
    INSERT INTO orders (customer_name, customer_phone, total_cents)
    VALUES (@customerName, @customerPhone, @totalCents)
  `)
  const insertItemStmt = db.prepare(`
    INSERT INTO order_items
      (order_id, product_id, product_name_snapshot, unit_price_cents_snapshot, quantity, line_total_cents)
    VALUES (@orderId, @productId, @productNameSnapshot, @unitPriceCentsSnapshot, @quantity, @lineTotalCents)
  `)
  const getOrderStmt = db.prepare('SELECT * FROM orders WHERE id = ?')
  const getItemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id')
  const listAllStmt = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC')
  const updateStatusStmt = db.prepare(`
    UPDATE orders
    SET status = @status, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id
  `)

  function rowToOrder(row: OrderRow, items: OrderItem[]): Order {
    return {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: row.status,
      totalCents: row.total_cents,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items
    }
  }

  function hydrate(row: OrderRow): Order {
    return rowToOrder(row, (getItemsStmt.all(row.id) as OrderItemRow[]).map(rowToOrderItem))
  }

  const createTx = db.transaction((payload: NewOrderPayload): number => {
    if (payload.items.length === 0) throw new Error('Cannot create an order with no items')
    if (!payload.customerName.trim()) throw new Error('Customer name is required')

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
    const orderId = Number(
      insertOrderStmt.run({
        customerName: payload.customerName.trim(),
        customerPhone: payload.customerPhone?.trim() || null,
        totalCents
      }).lastInsertRowid
    )

    for (const line of lines) {
      insertItemStmt.run({
        orderId,
        productId: line.productId,
        productNameSnapshot: line.name,
        unitPriceCentsSnapshot: line.unitPriceCents,
        quantity: line.quantity,
        lineTotalCents: line.lineTotalCents
      })
    }

    return orderId
  })

  return {
    create(payload: NewOrderPayload): Order {
      const orderId = createTx(payload)
      return hydrate(getOrderStmt.get(orderId) as OrderRow)
    },

    list(): Order[] {
      const rows = listAllStmt.all() as OrderRow[]
      return rows.map(hydrate)
    },

    getById(id: number): Order | null {
      const row = getOrderStmt.get(id) as OrderRow | undefined
      return row ? hydrate(row) : null
    },

    updateStatus(id: number, status: OrderStatus): Order {
      const existing = getOrderStmt.get(id) as OrderRow | undefined
      if (!existing) throw new Error(`Order ${id} not found`)
      updateStatusStmt.run({ id, status })
      return hydrate(getOrderStmt.get(id) as OrderRow)
    }
  }
}
