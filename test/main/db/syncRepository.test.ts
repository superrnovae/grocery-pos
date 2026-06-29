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
  createSyncRepository,
  type SyncRepository,
  type SyncSnapshot
} from '../../../src/main/db/syncRepository'

describe('syncRepository', () => {
  let db: Database.Database
  let products: ProductsRepository
  let customers: CustomersRepository
  let sales: SalesRepository
  let sync: SyncRepository

  beforeEach(() => {
    db = createDatabase(':memory:').db
    products = createProductsRepository(db)
    customers = createCustomersRepository(db)
    sales = createSalesRepository(db, products, customers)
    sync = createSyncRepository(db)
  })

  it('reports products and sales changed since a given timestamp, by uuid', () => {
    products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })
    const bread = products.list()[0]
    sales.create({ items: [{ productId: bread.id, quantity: 2 }] })

    const snapshot = sync.getChangesSince('0000-01-01T00:00:00.000Z')
    expect(snapshot.products).toHaveLength(1)
    expect(snapshot.products[0].name).toBe('Bread')
    expect(snapshot.products[0].uuid).toMatch(/^[0-9a-f]{32}$/)
    expect(snapshot.sales).toHaveLength(1)
    expect(snapshot.sales[0].items).toEqual([
      {
        productNameSnapshot: 'Bread',
        unitPriceCentsSnapshot: 200,
        quantity: 2,
        lineTotalCents: 400
      }
    ])

    expect(sync.getChangesSince('9999-01-01T00:00:00.000Z').products).toHaveLength(0)
  })

  it('applies incoming products as last-write-wins by updated_at', () => {
    const snapshot: SyncSnapshot = {
      products: [
        {
          uuid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          barcode: null,
          name: 'Milk',
          brand: null,
          category: null,
          priceCents: 150,
          imageUrl: null,
          source: 'manual',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ],
      sales: []
    }
    sync.applyChanges(snapshot)
    expect(products.list()).toHaveLength(1)
    expect(products.list()[0].priceCents).toBe(150)

    // An older incoming update must not overwrite the newer local row.
    sync.applyChanges({
      products: [
        { ...snapshot.products[0], priceCents: 999, updatedAt: '2025-01-01T00:00:00.000Z' }
      ],
      sales: []
    })
    expect(products.list()[0].priceCents).toBe(150)

    // A newer incoming update must win.
    sync.applyChanges({
      products: [
        { ...snapshot.products[0], priceCents: 175, updatedAt: '2027-01-01T00:00:00.000Z' }
      ],
      sales: []
    })
    expect(products.list()[0].priceCents).toBe(175)
  })

  it('applies incoming sales once, skipping duplicates by uuid', () => {
    const snapshot: SyncSnapshot = {
      products: [],
      sales: [
        {
          uuid: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          createdAt: '2026-01-01T00:00:00.000Z',
          totalCents: 400,
          discountCents: 0,
          items: [
            {
              productNameSnapshot: 'Bread',
              unitPriceCentsSnapshot: 200,
              quantity: 2,
              lineTotalCents: 400
            }
          ]
        }
      ]
    }
    sync.applyChanges(snapshot)
    sync.applyChanges(snapshot)

    expect(sales.list()).toHaveLength(1)
    expect(sales.list()[0].items[0].productNameSnapshot).toBe('Bread')
    expect(sales.list()[0].items[0].productId).toBeNull()
  })
})
