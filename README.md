# Grocery POS

A point-of-sale desktop application for a neighborhood grocery store, built with Electron, Vue 3, and TypeScript. Final project for the ic-etagsolutions.com Electron course.

See [DESIGN.md](./DESIGN.md) for the data model, architecture, and the reasoning behind the technical choices.

## Features

- Product catalog: add/edit/delete products, search by name or barcode
- Barcode lookup against [OpenFoodFacts](https://world.openfoodfacts.org) for known products (cashier confirms the price), with a manual-entry fallback for unknown barcodes or when offline
- Checkout: scan/search to build a cart, quantities, totals, and sale completion
- Sales history with per-sale receipts
- CSV export (sales, product catalog) and PDF export (receipts)
- French/English UI and light/dark theme, both persisted
- Fully offline for all core operations — only the barcode lookup needs network access
- System notifications on sale completion and failed lookups
- Packaged as a Windows installer (NSIS)

## Requirements

- Node.js 22+
- Windows (the installer target; `npm run dev` also runs on macOS/Linux during development)

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Tests

```bash
npm test
```

Runs the Vitest suite (repository logic against an in-memory SQLite database, cart math, CSV formatting, OpenFoodFacts response mapping). The `better-sqlite3` native module is built against Electron's Node ABI for normal use; `npm test` automatically rebuilds it against the system Node ABI first and restores the Electron build afterward.

## Build a Windows installer

```bash
npm run build:win
```

Produces `release/grocery-pos-<version>-setup.exe` (NSIS installer) plus an unpacked build under `release/win-unpacked/`.

## Screenshots

> TODO: replace with real screenshots after running the app (`npm run dev` or the installed build).

- _Checkout view — cart and totals_
- _Products view — OpenFoodFacts lookup workflow_
- _Installed application running_
