import type { NewProduct } from '@shared/types'
import type { ProductsRepository } from '../db/productsRepository'

const CHUNK_SIZE = 200

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < content.length) {
    const char = content[i]
    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += char
      i++
      continue
    }
    if (char === '"') {
      inQuotes = true
      i++
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (char === '\r') {
      i++
      continue
    }
    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += char
    i++
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((cols) => cols.length > 1 || cols[0] !== '')
}

export interface ParsedProductsCsv {
  rows: NewProduct[]
  errors: string[]
}

/** Parses a catalog CSV (same column layout as buildProductsCsv's export, minus id/source). */
export function parseProductsCsv(content: string): ParsedProductsCsv {
  const withoutBom = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
  const table = parseCsvRows(withoutBom)
  if (table.length === 0) return { rows: [], errors: [] }

  const header = table[0].map((cell) => cell.trim().toLowerCase())
  const nameIdx = header.indexOf('name')
  const priceIdx = header.indexOf('price')
  const barcodeIdx = header.indexOf('barcode')
  const brandIdx = header.indexOf('brand')
  const categoryIdx = header.indexOf('category')

  if (nameIdx === -1 || priceIdx === -1) {
    return { rows: [], errors: ['The CSV must have "name" and "price" columns.'] }
  }

  const rows: NewProduct[] = []
  const errors: string[] = []

  for (let i = 1; i < table.length; i++) {
    const cols = table[i]
    const name = cols[nameIdx]?.trim()
    const priceText = cols[priceIdx]?.trim()
    if (!name && !priceText) continue
    if (!name) {
      errors.push(`Row ${i + 1}: missing name.`)
      continue
    }
    const price = Number.parseFloat((priceText ?? '').replace(',', '.'))
    if (!Number.isFinite(price) || price <= 0) {
      errors.push(`Row ${i + 1}: invalid price "${priceText ?? ''}".`)
      continue
    }

    rows.push({
      name,
      brand: brandIdx !== -1 ? cols[brandIdx]?.trim() || null : null,
      category: categoryIdx !== -1 ? cols[categoryIdx]?.trim() || null : null,
      barcode: barcodeIdx !== -1 ? cols[barcodeIdx]?.trim() || null : null,
      priceCents: Math.round(price * 100),
      imageUrl: null,
      source: 'manual'
    })
  }

  return { rows, errors }
}

/**
 * Imports rows in chunks, yielding to the event loop between each one so a large file
 * doesn't freeze the app, reporting progress as it goes.
 */
export async function importProducts(
  repository: ProductsRepository,
  rows: NewProduct[],
  onProgress: (processed: number, total: number) => void
): Promise<number> {
  let imported = 0
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    imported += repository.bulkUpsert(chunk)
    onProgress(Math.min(i + CHUNK_SIZE, rows.length), rows.length)
    await new Promise((resolve) => setImmediate(resolve))
  }
  return imported
}
