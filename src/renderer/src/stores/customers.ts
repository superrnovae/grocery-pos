import { defineStore } from 'pinia'
import type { Customer, NewCustomer } from '@shared/types'

export const useCustomersStore = defineStore('customers', {
  state: () => ({
    items: [] as Customer[],
    loaded: false
  }),
  actions: {
    async load(): Promise<void> {
      this.items = await window.api.customers.list()
      this.loaded = true
    },
    async create(input: NewCustomer): Promise<Customer> {
      const created = await window.api.customers.create(input)
      this.items.push(created)
      this.items.sort((a, b) => a.name.localeCompare(b.name))
      return created
    },
    updateLocal(customer: Customer): void {
      const index = this.items.findIndex((item) => item.id === customer.id)
      if (index !== -1) this.items[index] = customer
    }
  }
})
