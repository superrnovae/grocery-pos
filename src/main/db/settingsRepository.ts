import type Database from 'better-sqlite3'
import type { AppSettings } from '@shared/types'

const DEFAULTS: AppSettings = {
  theme: 'light',
  locale: 'fr',
  syncMode: 'off',
  syncPort: 4178,
  syncHost: ''
}

export interface SettingsRepository {
  get(): AppSettings
  update(patch: Partial<AppSettings>): AppSettings
}

export function createSettingsRepository(db: Database.Database): SettingsRepository {
  const getStmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const setStmt = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = @value
  `)

  function getValue(key: string): string | undefined {
    return (getStmt.get(key) as { value: string } | undefined)?.value
  }

  function get(): AppSettings {
    const syncPort = getValue('syncPort')
    return {
      theme: (getValue('theme') as AppSettings['theme']) ?? DEFAULTS.theme,
      locale: (getValue('locale') as AppSettings['locale']) ?? DEFAULTS.locale,
      syncMode: (getValue('syncMode') as AppSettings['syncMode']) ?? DEFAULTS.syncMode,
      syncPort: syncPort ? Number(syncPort) : DEFAULTS.syncPort,
      syncHost: getValue('syncHost') ?? DEFAULTS.syncHost
    }
  }

  return {
    get,
    update(patch: Partial<AppSettings>): AppSettings {
      const merged = { ...get(), ...patch }
      if (patch.theme) setStmt.run({ key: 'theme', value: merged.theme })
      if (patch.locale) setStmt.run({ key: 'locale', value: merged.locale })
      if (patch.syncMode) setStmt.run({ key: 'syncMode', value: merged.syncMode })
      if (patch.syncPort) setStmt.run({ key: 'syncPort', value: String(merged.syncPort) })
      if (patch.syncHost !== undefined) setStmt.run({ key: 'syncHost', value: merged.syncHost })
      return merged
    }
  }
}
