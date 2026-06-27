import { beforeEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createDatabase } from '../../../src/main/db'
import {
  createProductsRepository,
  type ProductsRepository
} from '../../../src/main/db/productsRepository'
import { createSalesRepository, type SalesRepository } from '../../../src/main/db/salesRepository'

describe('salesRepository', () => {
  let db: Database.Database
  let products: ProductsRepository
  let sales: SalesRepository

  beforeEach(() => {
    db = createDatabase(':memory:')
    products = createProductsRepository(db)
    sales = createSalesRepository(db, products)
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
})
