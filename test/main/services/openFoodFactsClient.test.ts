import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupByBarcode } from '../../../src/main/services/openFoodFactsClient'

describe('openFoodFactsClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps a found product', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: 'Nutella',
            brands: 'Ferrero',
            categories: 'Spreads',
            image_url: 'https://images.openfoodfacts.org/nutella.jpg'
          }
        })
      })
    )

    const result = await lookupByBarcode('3017620422003')

    expect(result).toEqual({
      found: true,
      product: {
        barcode: '3017620422003',
        name: 'Nutella',
        brand: 'Ferrero',
        category: 'Spreads',
        imageUrl: 'https://images.openfoodfacts.org/nutella.jpg'
      }
    })
  })

  it('reports not found when OpenFoodFacts has no match', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 0 })
      })
    )

    const result = await lookupByBarcode('0000000000000')

    expect(result).toEqual({ found: false })
  })

  it('reports not found on a non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const result = await lookupByBarcode('123')

    expect(result).toEqual({ found: false })
  })
})
