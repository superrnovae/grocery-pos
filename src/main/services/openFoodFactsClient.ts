import type { OpenFoodFactsLookupResult } from '@shared/types'

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product'

interface OpenFoodFactsResponse {
  status: number
  product?: {
    product_name?: string
    brands?: string
    categories?: string
    image_url?: string
  }
}

/** Looks up a barcode against OpenFoodFacts. Throws on network failure — callers decide the offline fallback. */
export async function lookupByBarcode(barcode: string): Promise<OpenFoodFactsLookupResult> {
  const response = await fetch(`${OFF_BASE_URL}/${encodeURIComponent(barcode)}.json`)
  if (!response.ok) {
    return { found: false }
  }

  const body = (await response.json()) as OpenFoodFactsResponse
  if (body.status !== 1 || !body.product) {
    return { found: false }
  }

  return {
    found: true,
    product: {
      barcode,
      name: body.product.product_name ?? null,
      brand: body.product.brands ?? null,
      category: body.product.categories ?? null,
      imageUrl: body.product.image_url ?? null
    }
  }
}
