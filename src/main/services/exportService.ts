import { BrowserWindow } from 'electron'
import type { Product, Sale } from '@shared/types'

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function buildSalesCsv(sales: Sale[]): string {
  const rows = sales.map((sale) => [
    String(sale.id),
    sale.createdAt,
    sale.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join('; '),
    formatAmount(sale.totalCents)
  ])
  return toCsv(['id', 'date', 'items', 'total'], rows)
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

function buildReceiptHtml(sale: Sale): string {
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
    <p class="muted">Receipt #${sale.id} — ${new Date(sale.createdAt).toLocaleString()}</p>
    <table>
      <thead>
        <tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="3">Total</td><td>${formatAmount(sale.totalCents)}</td></tr>
      </tfoot>
    </table>
  </body>
</html>`
}

/** Renders a sale as a standalone receipt and prints it to a PDF buffer via a hidden window. */
export async function renderReceiptPdf(sale: Sale): Promise<Buffer> {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
  try {
    const html = buildReceiptHtml(sale)
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    return await win.webContents.printToPDF({})
  } finally {
    win.close()
  }
}
