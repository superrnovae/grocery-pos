import { beforeEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createDatabase } from '../../../src/main/db'
import {
  createProductsRepository,
  type ProductsRepository
} from '../../../src/main/db/productsRepository'
import {
  createOrdersRepository,
  type OrdersRepository
} from '../../../src/main/db/ordersRepository'

describe('ordersRepository', () => {
  let db: Database.Database
  let products: ProductsRepository
  let orders: OrdersRepository

  beforeEach(() => {
    db = createDatabase(':memory:')
    products = createProductsRepository(db)
    orders = createOrdersRepository(db, products)
  })

  it('snapshots product name/price and computes the total at order time', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })

    const order = orders.create({
      customerName: 'Alice',
      customerPhone: '111',
      items: [{ productId: bread.id, quantity: 3 }]
    })

    expect(order.status).toBe('pending')
    expect(order.totalCents).toBe(600)
    expect(order.items[0].productNameSnapshot).toBe('Bread')
  })

  it('rejects an order with no items or no customer name', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })

    expect(() => orders.create({ customerName: 'Alice', items: [] })).toThrow()
    expect(() =>
      orders.create({ customerName: '  ', items: [{ productId: bread.id, quantity: 1 }] })
    ).toThrow()
  })

  it('advances order status', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })
    const order = orders.create({
      customerName: 'Alice',
      items: [{ productId: bread.id, quantity: 1 }]
    })

    const updated = orders.updateStatus(order.id, 'delivered')
    expect(updated.status).toBe('delivered')
    expect(orders.getById(order.id)?.status).toBe('delivered')
  })

  it('lists orders most recent first', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })
    const first = orders.create({
      customerName: 'Alice',
      items: [{ productId: bread.id, quantity: 1 }]
    })
    const second = orders.create({
      customerName: 'Bob',
      items: [{ productId: bread.id, quantity: 1 }]
    })

    expect(orders.list().map((order) => order.id)).toEqual([second.id, first.id])
  })
})
