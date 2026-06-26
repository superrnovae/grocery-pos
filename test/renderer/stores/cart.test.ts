import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../../../src/renderer/src/stores/cart'
import type { Product } from '../../../src/shared/types'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    barcode: null,
    name: 'Bread',
    brand: null,
    category: null,
    priceCents: 200,
    imageUrl: null,
    source: 'manual',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('merges quantities when the same product is added twice', () => {
    const cart = useCartStore()
    const bread = makeProduct()

    cart.addProduct(bread, 1)
    cart.addProduct(bread, 2)

    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].quantity).toBe(3)
    expect(cart.totalCents).toBe(600)
  })

  it('computes totals across multiple distinct products', () => {
    const cart = useCartStore()
    cart.addProduct(makeProduct({ id: 1, priceCents: 200 }), 2)
    cart.addProduct(makeProduct({ id: 2, priceCents: 350 }), 1)

    expect(cart.totalCents).toBe(750)
    expect(cart.itemCount).toBe(3)
  })

  it('removes a line when its quantity drops to zero', () => {
    const cart = useCartStore()
    const bread = makeProduct()
    cart.addProduct(bread, 2)

    cart.setQuantity(bread.id, 0)

    expect(cart.lines).toHaveLength(0)
  })
})
