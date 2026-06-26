import { defineStore } from 'pinia'

export const useOnlineStore = defineStore('online', {
  state: () => ({ isOnline: navigator.onLine }),
  actions: {
    init(): void {
      window.addEventListener('online', () => {
        this.isOnline = true
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }
})
