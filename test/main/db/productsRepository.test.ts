import { beforeEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createDatabase } from '../../../src/main/db'
import {
  createProductsRepository,
  type ProductsRepository
} from '../../../src/main/db/productsRepository'

describe('productsRepository', () => {
  let db: Database.Database
  let repository: ProductsRepository

  beforeEach(() => {
    db = createDatabase(':memory:').db
    repository = createProductsRepository(db)
  })

  it('creates and retrieves a product', () => {
    const created = repository.create({
      barcode: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      category: 'Spreads',
      priceCents: 399,
      imageUrl: null,
      source: 'openfoodfacts'
    })

    expect(created.id).toBeGreaterThan(0)
    expect(repository.findById(created.id)).toEqual(created)
    expect(repository.findByBarcode('3017620422003')).toEqual(created)
  })

  it('lists products alphabetically by name', () => {
    repository.create({
      barcode: null,
      name: 'Zucchini',
      brand: null,
      category: null,
      priceCents: 150,
      imageUrl: null,
      source: 'manual'
    })
    repository.create({
      barcode: null,
      name: 'Apple',
      brand: null,
      category: null,
      priceCents: 50,
      imageUrl: null,
      source: 'manual'
    })

    expect(repository.list().map((p) => p.name)).toEqual(['Apple', 'Zucchini'])
  })

  it('updates a product and bumps updatedAt', () => {
    const created = repository.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })

    const updated = repository.update(created.id, { priceCents: 250 })

    expect(updated.priceCents).toBe(250)
    expect(updated.name).toBe('Bread')
  })

  it('rejects a duplicate barcode', () => {
    repository.create({
      barcode: '111',
      name: 'A',
      brand: null,
      category: null,
      priceCents: 100,
      imageUrl: null,
      source: 'manual'
    })

    expect(() =>
      repository.create({
        barcode: '111',
        name: 'B',
        brand: null,
        category: null,
        priceCents: 200,
        imageUrl: null,
        source: 'manual'
      })
    ).toThrow()
  })
})
