import { Notification } from 'electron'
import type { Locale } from '@shared/types'

const MESSAGES = {
  saleCompleted: {
    fr: (total: string) => ({ title: 'Vente enregistrée', body: `Total : ${total}` }),
    en: (total: string) => ({ title: 'Sale recorded', body: `Total: ${total}` })
  },
  lookupFailed: {
    fr: (barcode: string) => ({
      title: 'Recherche en ligne impossible',
      body: `La recherche du code-barres ${barcode} a échoué (hors ligne ou erreur réseau). Saisie manuelle requise.`
    }),
    en: (barcode: string) => ({
      title: 'Online lookup failed',
      body: `Looking up barcode ${barcode} failed (offline or network error). Manual entry required.`
    })
  }
} as const

function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2)
}

function show(title: string, body: string): void {
  if (!Notification.isSupported()) return
  new Notification({ title, body }).show()
}

export function notifySaleCompleted(totalCents: number, locale: Locale): void {
  const { title, body } = MESSAGES.saleCompleted[locale](formatCurrency(totalCents))
  show(title, body)
}

export function notifyLookupFailed(barcode: string, locale: Locale): void {
  const { title, body } = MESSAGES.lookupFailed[locale](barcode)
  show(title, body)
}
