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

  it('aborts the request via the signal passed to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 0 }) })
    vi.stubGlobal('fetch', fetchMock)

    await lookupByBarcode('123')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('propagates an abort error to the caller', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options?: { signal?: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          if (options?.signal?.aborted) {
            reject(new Error('aborted'))
            return
          }
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
      })
    )

    const pending = lookupByBarcode('123')
    const controllerSignal = (vi.mocked(fetch).mock.calls[0]?.[1] as { signal?: AbortSignal })
      ?.signal
    controllerSignal?.dispatchEvent(new Event('abort'))

    await expect(pending).rejects.toThrow('aborted')
  })
})
