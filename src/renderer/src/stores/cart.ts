import { defineStore } from 'pinia'
import type { CartLine, Product } from '@shared/types'

export const useCartStore = defineStore('cart', {
  state: () => ({
    lines: [] as CartLine[]
  }),
  getters: {
    totalCents(state): number {
      return state.lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0)
    },
    itemCount(state): number {
      return state.lines.reduce((sum, line) => sum + line.quantity, 0)
    }
  },
  actions: {
    addProduct(product: Product, quantity = 1): void {
      const existing = this.lines.find((line) => line.product.id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        this.lines.push({ product, quantity })
      }
    },
    setQuantity(productId: number, quantity: number): void {
      if (quantity <= 0) {
        this.removeProduct(productId)
        return
      }
      const line = this.lines.find((l) => l.product.id === productId)
      if (line) line.quantity = quantity
    },
    removeProduct(productId: number): void {
      this.lines = this.lines.filter((line) => line.product.id !== productId)
    },
    clear(): void {
      this.lines = []
    },
    syncWithCatalog(catalog: Product[]): { removed: Product[]; updated: Product[] } {
      const catalogById = new Map(catalog.map((product) => [product.id, product]))
      const removed: Product[] = []
      const updated: Product[] = []
      const nextLines: CartLine[] = []
      for (const line of this.lines) {
        const current = catalogById.get(line.product.id)
        if (!current) {
          removed.push(line.product)
          continue
        }
        if (current.priceCents !== line.product.priceCents || current.name !== line.product.name) {
          updated.push(current)
        }
        nextLines.push({ product: current, quantity: line.quantity })
      }
      this.lines = nextLines
      return { removed, updated }
    }
  }
})
