import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { createDatabase } from '../../../src/main/db'
import { createProductsRepository } from '../../../src/main/db/productsRepository'
import {
  createBackup,
  isValidBackup,
  restoreBackup
} from '../../../src/main/services/backupService'

describe('backupService', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'grocery-pos-backup-test-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('creates a real, independently-openable backup file', async () => {
    const { db } = createDatabase(':memory:')
    const products = createProductsRepository(db)
    products.create({
      barcode: null,
      name: 'Bread',
      brand: null,
      category: null,
      priceCents: 200,
      imageUrl: null,
      source: 'manual'
    })

    const backupPath = join(dir, 'backup.sqlite3')
    await createBackup(db, backupPath)

    expect(isValidBackup(backupPath)).toBe(true)
    const reopened = new Database(backupPath, { readonly: true })
    expect(reopened.prepare('SELECT name FROM products').get()).toEqual({ name: 'Bread' })
    reopened.close()
  })

  it('rejects files that are missing or not a grocery-pos database', () => {
    expect(isValidBackup(join(dir, 'does-not-exist.sqlite3'))).toBe(false)

    const notADb = join(dir, 'not-a-db.sqlite3')
    writeFileSync(notADb, 'just some text')
    expect(isValidBackup(notADb)).toBe(false)
  })

  it('overwrites the live file with the backup and closes the live connection', async () => {
    const { db: backupSourceDb } = createDatabase(':memory:')
    createProductsRepository(backupSourceDb).create({
      barcode: null,
      name: 'Milk',
      brand: null,
      category: null,
      priceCents: 150,
      imageUrl: null,
      source: 'manual'
    })
    const backupPath = join(dir, 'backup.sqlite3')
    await createBackup(backupSourceDb, backupPath)

    const liveFilePath = join(dir, 'live.sqlite3')
    const { db: liveDb } = createDatabase(liveFilePath)

    restoreBackup(liveDb, backupPath, liveFilePath)

    const reopenedLive = new Database(liveFilePath, { readonly: true })
    expect(reopenedLive.prepare('SELECT name FROM products').get()).toEqual({ name: 'Milk' })
    reopenedLive.close()
  })
})
