import type Database from 'better-sqlite3'
import type { AppSettings } from '@shared/types'

const DEFAULTS: AppSettings = { theme: 'light', locale: 'fr' }

export function createSettingsRepository(db: Database.Database) {
  const getStmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const setStmt = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = @value
  `)

  function get(): AppSettings {
    const theme = (getStmt.get('theme') as { value: string } | undefined)?.value
    const locale = (getStmt.get('locale') as { value: string } | undefined)?.value
    return {
      theme: (theme as AppSettings['theme']) ?? DEFAULTS.theme,
      locale: (locale as AppSettings['locale']) ?? DEFAULTS.locale
    }
  }

  return {
    get,
    update(patch: Partial<AppSettings>): AppSettings {
      const merged = { ...get(), ...patch }
      if (patch.theme) setStmt.run({ key: 'theme', value: merged.theme })
      if (patch.locale) setStmt.run({ key: 'locale', value: merged.locale })
      return merged
    }
  }
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>
