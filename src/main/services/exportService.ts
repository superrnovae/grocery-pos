import { BrowserWindow } from 'electron'
import type { Locale, Product, Sale } from '@shared/types'

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Prefixed with a UTF-8 BOM so Excel detects the encoding instead of mangling accented characters. */
function toCsv(headers: string[], rows: string[][]): string {
  const body = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
  const BOM = String.fromCharCode(0xfeff)
  return BOM + body
}

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function buildSalesCsv(sales: Sale[]): string {
  const rows = sales.map((sale) => [
    String(sale.id),
    sale.createdAt,
    sale.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join('; '),
    formatAmount(sale.discountCents),
    formatAmount(sale.totalCents)
  ])
  return toCsv(['id', 'date', 'items', 'discount', 'total'], rows)
}

export function buildProductsCsv(products: Product[]): string {
  const rows = products.map((product) => [
    String(product.id),
    product.barcode ?? '',
    product.name,
    product.brand ?? '',
    product.category ?? '',
    formatAmount(product.priceCents),
    product.source
  ])
  return toCsv(['id', 'barcode', 'name', 'brand', 'category', 'price', 'source'], rows)
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const RECEIPT_LABELS = {
  fr: {
    receipt: (id: number) => `Reçu #${id}`,
    product: 'Produit',
    qty: 'Qté',
    unitPrice: 'Prix unitaire',
    total: 'Total',
    discount: 'Remise fidélité'
  },
  en: {
    receipt: (id: number) => `Receipt #${id}`,
    product: 'Product',
    qty: 'Qty',
    unitPrice: 'Unit price',
    total: 'Total',
    discount: 'Loyalty discount'
  }
} as const

function buildReceiptHtml(sale: Sale, locale: Locale): string {
  const labels = RECEIPT_LABELS[locale]
  const rows = sale.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.productNameSnapshot)}</td>
          <td>${item.quantity}</td>
          <td>${formatAmount(item.unitPriceCentsSnapshot)}</td>
          <td>${formatAmount(item.lineTotalCents)}</td>
        </tr>`
    )
    .join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: sans-serif; padding: 24px; color: #1b1b1f; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      .muted { color: #5a5a60; font-size: 12px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid #d8d8db; font-size: 13px; }
      tfoot td { font-weight: 700; border-top: 2px solid #1b1b1f; border-bottom: none; }
    </style>
  </head>
  <body>
    <h1>Grocery POS</h1>
    <p class="muted">${escapeHtml(labels.receipt(sale.id))} — ${new Date(sale.createdAt).toLocaleString(locale)}</p>
    <table>
      <thead>
        <tr><th>${labels.product}</th><th>${labels.qty}</th><th>${labels.unitPrice}</th><th>${labels.total}</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        ${
          sale.discountCents > 0
            ? `<tr><td colspan="3">${labels.discount}</td><td>-${formatAmount(sale.discountCents)}</td></tr>`
            : ''
        }
        <tr><td colspan="3">${labels.total}</td><td>${formatAmount(sale.totalCents)}</td></tr>
      </tfoot>
    </table>
  </body>
</html>`
}

async function withReceiptWindow<T>(
  sale: Sale,
  locale: Locale,
  action: (win: BrowserWindow) => Promise<T>
): Promise<T> {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
  try {
    const html = buildReceiptHtml(sale, locale)
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    return await action(win)
  } finally {
    win.close()
  }
}

/** Renders a sale as a standalone receipt and prints it to a PDF buffer via a hidden window. */
export async function renderReceiptPdf(sale: Sale, locale: Locale): Promise<Buffer> {
  return withReceiptWindow(sale, locale, (win) => win.webContents.printToPDF({}))
}

/** Opens the OS print dialog for the receipt, so the cashier can print a physical ticket. */
export async function printReceipt(sale: Sale, locale: Locale): Promise<void> {
  await withReceiptWindow(
    sale,
    locale,
    (win) =>
      new Promise<void>((resolve, reject) => {
        win.webContents.print({ silent: false }, (success, failureReason) => {
          if (success || failureReason === 'cancelled') {
            resolve()
          } else {
            reject(new Error(failureReason))
          }
        })
      })
  )
}
