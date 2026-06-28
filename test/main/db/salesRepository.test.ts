import { beforeEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createDatabase } from '../../../src/main/db'
import {
  createProductsRepository,
  type ProductsRepository
} from '../../../src/main/db/productsRepository'
import {
  createCustomersRepository,
  type CustomersRepository
} from '../../../src/main/db/customersRepository'
import { createSalesRepository, type SalesRepository } from '../../../src/main/db/salesRepository'

describe('salesRepository', () => {
  let db: Database.Database
  let products: ProductsRepository
  let customers: CustomersRepository
  let sales: SalesRepository

  beforeEach(() => {
    db = createDatabase(':memory:').db
    products = createProductsRepository(db)
    customers = createCustomersRepository(db)
    sales = createSalesRepository(db, products, customers)
  })

  it('snapshots product name/price and computes totals at sale time', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })

    const sale = sales.create({ items: [{ productId: bread.id, quantity: 3 }] })

    expect(sale.totalCents).toBe(600)
    expect(sale.items).toHaveLength(1)
    expect(sale.items[0].productNameSnapshot).toBe('Bread')
    expect(sale.items[0].unitPriceCentsSnapshot).toBe(200)
    expect(sale.items[0].lineTotalCents).toBe(600)

    // Later price changes must not retroactively change a past sale's snapshot.
    products.update(bread.id, { priceCents: 999 })
    const reloaded = sales.getById(sale.id)
    expect(reloaded?.items[0].unitPriceCentsSnapshot).toBe(200)
  })

  it('rolls back the whole sale if any line item is invalid', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })

    expect(() =>
      sales.create({
        items: [
          { productId: bread.id, quantity: 1 },
          { productId: 9999, quantity: 1 }
        ]
      })
    ).toThrow()

    expect(sales.list()).toHaveLength(0)
  })

  it('rejects an empty sale', () => {
    expect(() => sales.create({ items: [] })).toThrow()
  })

  it('lists multiple sales, each hydrated with its own items in order', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })
    const milk = products.create({
      barcode: null,
      name: 'Milk',
      brand: null,
      category: null,
      priceCents: 150,
      imageUrl: null,
      source: 'manual'
    })

    const saleA = sales.create({
      items: [
        { productId: bread.id, quantity: 1 },
        { productId: milk.id, quantity: 2 }
      ]
    })
    const saleB = sales.create({ items: [{ productId: milk.id, quantity: 1 }] })

    const list = sales.list()
    const reloadedA = list.find((sale) => sale.id === saleA.id)
    const reloadedB = list.find((sale) => sale.id === saleB.id)

    expect(reloadedA?.items.map((item) => item.productNameSnapshot)).toEqual(['Bread', 'Milk'])
    expect(reloadedB?.items.map((item) => item.productNameSnapshot)).toEqual(['Milk'])
  })

  it('filters sales by date range', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })
    sales.create({ items: [{ productId: bread.id, quantity: 1 }] })

    expect(sales.list({ fromDate: '0000-01-01', toDate: '9999-12-31' })).toHaveLength(1)
    expect(sales.list({ fromDate: '9999-01-01' })).toHaveLength(0)
  })

  it('filters sales by customer', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })
    const alice = customers.create({ name: 'Alice', phone: '111' })
    sales.create({ items: [{ productId: bread.id, quantity: 1 }], customerId: alice.id })
    sales.create({ items: [{ productId: bread.id, quantity: 1 }] })

    expect(sales.list({ customerId: alice.id })).toHaveLength(1)
    expect(sales.list()).toHaveLength(2)
  })

  it('awards 1 point per euro of the post-discount total to the chosen customer', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 1000,
      imageUrl: null,
      source: 'manual'
    })
    const alice = customers.create({ name: 'Alice', phone: '111' })

    sales.create({ items: [{ productId: bread.id, quantity: 1 }], customerId: alice.id })

    expect(customers.findById(alice.id)?.points).toBe(10)
  })

  it('redeems points in multiples of 100 for a clamped discount and deducts only what was applied', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 500,
      imageUrl: null,
      source: 'manual'
    })
    const alice = customers.create({ name: 'Alice', phone: '111' })
    customers.addPoints(alice.id, 1000)

    const sale = sales.create({
      items: [{ productId: bread.id, quantity: 1 }],
      customerId: alice.id,
      redeemPoints: 1000
    })

    expect(sale.discountCents).toBe(500)
    expect(sale.totalCents).toBe(0)
    // 1000 starting points - 500 redeemed (clamped to the subtotal) + 0 earned on a free sale.
    expect(customers.findById(alice.id)?.points).toBe(500)
  })

  it('rejects redeeming more points than the customer has', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 500,
      imageUrl: null,
      source: 'manual'
    })
    const alice = customers.create({ name: 'Alice', phone: '111' })

    expect(() =>
      sales.create({
        items: [{ productId: bread.id, quantity: 1 }],
        customerId: alice.id,
        redeemPoints: 100
      })
    ).toThrow()
  })

  it('rejects redeeming a non-multiple-of-100 points amount', () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 500,
      imageUrl: null,
      source: 'manual'
    })
    const alice = customers.create({ name: 'Alice', phone: '111' })
    customers.addPoints(alice.id, 50)

    expect(() =>
      sales.create({
        items: [{ productId: bread.id, quantity: 1 }],
        customerId: alice.id,
        redeemPoints: 50
      })
    ).toThrow()
  })
})
