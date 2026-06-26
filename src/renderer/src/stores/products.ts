import { defineStore } from 'pinia'
import type { NewProduct, Product, ProductUpdate } from '@shared/types'

export const useProductsStore = defineStore('products', {
  state: () => ({
    items: [] as Product[],
    loaded: false
  }),
  actions: {
    async load(): Promise<void> {
      this.items = await window.api.products.list()
      this.loaded = true
    },
    async create(input: NewProduct): Promise<Product> {
      const created = await window.api.products.create(input)
      this.items.push(created)
      this.items.sort((a, b) => a.name.localeCompare(b.name))
      return created
    },
    async update(id: number, patch: ProductUpdate): Promise<Product> {
      const updated = await window.api.products.update(id, patch)
      const index = this.items.findIndex((product) => product.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    },
    async remove(id: number): Promise<void> {
      await window.api.products.delete(id)
      this.items = this.items.filter((product) => product.id !== id)
    }
  }
})
