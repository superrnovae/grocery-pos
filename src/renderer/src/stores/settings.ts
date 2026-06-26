import { defineStore } from 'pinia'
import type { AppSettings, Theme } from '@shared/types'
import { i18n } from '../i18n'

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useSettingsStore = defineStore('settings', {
  state: (): AppSettings & { loaded: boolean } => ({
    theme: 'light',
    locale: 'fr',
    loaded: false
  }),
  actions: {
    async load(): Promise<void> {
      const settings = await window.api.settings.get()
      this.theme = settings.theme
      this.locale = settings.locale
      applyTheme(this.theme)
      i18n.global.locale.value = this.locale
      this.loaded = true
    },
    async setTheme(theme: Theme): Promise<void> {
      this.theme = theme
      applyTheme(theme)
      await window.api.settings.update({ theme })
    },
    async toggleTheme(): Promise<void> {
      await this.setTheme(this.theme === 'light' ? 'dark' : 'light')
    },
    async setLocale(locale: AppSettings['locale']): Promise<void> {
      this.locale = locale
      i18n.global.locale.value = locale
      await window.api.settings.update({ locale })
    }
  }
})
