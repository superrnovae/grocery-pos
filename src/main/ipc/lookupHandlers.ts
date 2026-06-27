import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-contract'
import type { OpenFoodFactsLookupResult } from '@shared/types'
import type { SettingsRepository } from '../db/settingsRepository'
import { lookupByBarcode } from '../services/openFoodFactsClient'
import { notifyLookupFailed } from '../services/notifications'

const BARCODE_PATTERN = /^[0-9]{6,14}$/

export function registerLookupHandlers(settings: SettingsRepository): void {
  ipcMain.handle(
    IpcChannel.LookupByBarcode,
    async (_event, barcode: unknown): Promise<OpenFoodFactsLookupResult> => {
      if (typeof barcode !== 'string' || !BARCODE_PATTERN.test(barcode)) {
        throw new Error('Invalid barcode format')
      }

      try {
        return await lookupByBarcode(barcode)
      } catch (error) {
        // Offline or network failure: never block checkout, fall back to manual entry.
        console.error('OpenFoodFacts lookup failed', error)
        notifyLookupFailed(barcode, settings.get().locale)
        return { found: false }
      }
    }
  )
}
