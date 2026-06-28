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
import {
  createAnalyticsRepository,
  type AnalyticsRepository
} from '../../../src/main/db/analyticsRepository'

describe('analyticsRepository', () => {
  let db: Database.Database
  let products: ProductsRepository
  let customers: CustomersRepository
  let sales: SalesRepository
  let analytics: AnalyticsRepository

  beforeEach(() => {
    db = createDatabase(':memory:').db
    products = createProductsRepository(db)
    customers = createCustomersRepository(db)
    sales = createSalesRepository(db, products, customers)
    analytics = createAnalyticsRepository(db)
  })

  it("sums today's revenue and reports zero for yesterday when there are no past sales", () => {
    const bread = products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })
    sales.create({ items: [{ productId: bread.id, quantity: 2 }] })

    const stats = analytics.getDashboardStats()
    expect(stats.todayRevenueCents).toBe(400)
    expect(stats.yesterdayRevenueCents).toBe(0)
  })

  it('ranks the top products by total quantity sold, by name snapshot', () => {
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

    sales.create({
      items: [
        { productId: bread.id, quantity: 5 },
        { productId: milk.id, quantity: 1 }
      ]
    })
    products.delete(bread.id)

    const stats = analytics.getDashboardStats()
    expect(stats.topProducts[0]).toEqual({ name: 'Bread', quantity: 5 })
    expect(stats.topProducts[1]).toEqual({ name: 'Milk', quantity: 1 })
  })
})
