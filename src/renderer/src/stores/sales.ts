import { defineStore } from 'pinia'
import type { NewSalePayload, Sale } from '@shared/types'
import type { SalesListFilter } from '@shared/ipc-contract'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    items: [] as Sale[],
    loaded: false
  }),
  actions: {
    async load(filter: SalesListFilter = {}): Promise<void> {
      this.items = await window.api.sales.list(filter)
      this.loaded = true
    },
    async create(payload: NewSalePayload): Promise<Sale> {
      const sale = await window.api.sales.create(payload)
      this.items.unshift(sale)
      return sale
    },
    async getById(id: number): Promise<Sale | null> {
      const cached = this.items.find((sale) => sale.id === id)
      if (cached) return cached
      return window.api.sales.getById(id)
    }
  }
})
