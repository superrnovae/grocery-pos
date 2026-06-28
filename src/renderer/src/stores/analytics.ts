import { defineStore } from 'pinia'
import type { DashboardStats } from '@shared/types'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    stats: null as DashboardStats | null
  }),
  actions: {
    async load(): Promise<void> {
      this.stats = await window.api.analytics.getDashboardStats()
    }
  }
})
