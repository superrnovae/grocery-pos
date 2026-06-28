import { defineStore } from 'pinia'
import type { NewOrderPayload, Order, OrderStatus } from '@shared/types'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    items: [] as Order[],
    loaded: false
  }),
  actions: {
    async load(): Promise<void> {
      this.items = await window.api.orders.list()
      this.loaded = true
    },
    async create(payload: NewOrderPayload): Promise<Order> {
      const created = await window.api.orders.create(payload)
      this.items.unshift(created)
      return created
    },
    async updateStatus(id: number, status: OrderStatus): Promise<Order> {
      const updated = await window.api.orders.updateStatus(id, status)
      const index = this.items.findIndex((order) => order.id === id)
      if (index !== -1) this.items[index] = updated
      return updated
    }
  }
})
