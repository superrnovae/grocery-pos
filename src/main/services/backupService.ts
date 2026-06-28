import { copyFileSync, existsSync } from 'fs'
import Database from 'better-sqlite3'

/** Uses better-sqlite3's online backup API, safe to run while the live database is open. */
export async function createBackup(db: Database.Database, destPath: string): Promise<void> {
  await db.backup(destPath)
}

/** Sanity-checks that a file is a SQLite database with a `products` table before restoring it. */
export function isValidBackup(sourcePath: string): boolean {
  if (!existsSync(sourcePath)) return false
  let probe: Database.Database | undefined
  try {
    probe = new Database(sourcePath, { readonly: true })
    const hasProductsTable = probe
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'")
      .get()
    return Boolean(hasProductsTable)
  } catch {
    return false
  } finally {
    probe?.close()
  }
}

/** Closes the live database and overwrites it with the backup; caller must relaunch the app after. */
export function restoreBackup(
  db: Database.Database,
  sourcePath: string,
  liveFilePath: string
): void {
  db.close()
  copyFileSync(sourcePath, liveFilePath)
}
