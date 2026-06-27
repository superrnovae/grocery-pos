import { describe, expect, it } from 'vitest'
import { buildProductsCsv, buildSalesCsv } from '../../../src/main/services/exportService'
import type { Product, Sale } from '../../../src/shared/types'

describe('exportService', () => {
  it('builds a sales CSV with one row per sale and escapes commas in item names', () => {
    const sales: Sale[] = [
      {
        id: 1,
        createdAt: '2026-01-01T10:00:00.000Z',
        totalCents: 600,
        items: [
          {
            id: 1,
            saleId: 1,
            productId: 1,
            productNameSnapshot: 'Bread, white',
            unitPriceCentsSnapshot: 200,
            quantity: 3,
            lineTotalCents: 600
          }
        ]
      }
    ]

    const csv = buildSalesCsv(sales)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const lines = csv.slice(1).split('\r\n')

    expect(lines[0]).toBe('id,date,items,total')
    expect(lines[1]).toBe('1,2026-01-01T10:00:00.000Z,"Bread, white x3",6.00')
  })

  it('builds a products CSV with empty strings for null fields', () => {
    const products: Product[] = [
      {
        id: 1,
        barcode: null,
        name: 'Apple',
        brand: null,
        category: null,
        priceCents: 50,
        imageUrl: null,
        source: 'manual',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ]

    const csv = buildProductsCsv(products)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const lines = csv.slice(1).split('\r\n')

    expect(lines[0]).toBe('id,barcode,name,brand,category,price,source')
    expect(lines[1]).toBe('1,,Apple,,,0.50,manual')
  })
})
