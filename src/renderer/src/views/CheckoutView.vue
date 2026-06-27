<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useSalesStore } from '../stores/sales'
import { formatPrice } from '../utils/format'
import type { Product } from '@shared/types'

const { t, locale } = useI18n()
const router = useRouter()
const products = useProductsStore()
const cart = useCartStore()
const sales = useSalesStore()

const search = ref('')
const barcodeInput = ref('')
const message = ref('')
const completing = ref(false)

onMounted(async () => {
  if (!products.loaded) {
    try {
      await products.load()
    } catch (error) {
      console.error('Failed to load products', error)
      message.value = t('common.loadError')
      return
    }
  }
  const { removed, updated } = cart.syncWithCatalog(products.items)
  if (removed.length > 0) {
    message.value = t('checkout.cartItemsRemoved', { count: removed.length })
  } else if (updated.length > 0) {
    message.value = t('checkout.cartItemsUpdated', { count: updated.length })
  }
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return []
  return products.items
    .filter(
      (product) =>
        product.name.toLowerCase().includes(query) || (product.barcode ?? '').includes(query)
    )
    .slice(0, 8)
})

function addProduct(product: Product): void {
  cart.addProduct(product)
  search.value = ''
}

function addFirstFiltered(): void {
  if (filtered.value.length === 0) return
  addProduct(filtered.value[0])
}

async function addByBarcode(): Promise<void> {
  const barcode = barcodeInput.value.trim()
  if (!barcode) return

  try {
    const product = await window.api.products.findByBarcode(barcode)
    if (product) {
      cart.addProduct(product)
      message.value = ''
    } else {
      message.value = t('checkout.unknownBarcode', { barcode })
    }
  } catch (error) {
    console.error('Barcode add failed', error)
    message.value = t('checkout.lookupError')
  } finally {
    barcodeInput.value = ''
  }
}

function changeQuantity(productId: number, delta: number): void {
  const line = cart.lines.find((l) => l.product.id === productId)
  if (!line) return
  cart.setQuantity(productId, line.quantity + delta)
}

async function completeSale(): Promise<void> {
  if (cart.lines.length === 0 || completing.value) return
  completing.value = true
  try {
    const sale = await sales.create({
      items: cart.lines.map((line) => ({ productId: line.product.id, quantity: line.quantity }))
    })
    cart.clear()
    router.push({ name: 'receipt', params: { id: String(sale.id) } })
  } catch (error) {
    console.error('Complete sale failed', error)
    message.value = t('checkout.completeSaleError')
  } finally {
    completing.value = false
  }
}
</script>

<template>
  <section class="checkout-view">
    <div class="lookup-row">
      <form class="barcode-form" @submit.prevent="addByBarcode">
        <input v-model="barcodeInput" type="text" :placeholder="t('checkout.barcodePlaceholder')" />
        <button type="submit">{{ t('checkout.addButton') }}</button>
      </form>
      <div class="search-box">
        <input
          v-model="search"
          type="search"
          :placeholder="t('checkout.searchPlaceholder')"
          @keydown.enter="addFirstFiltered"
        />
        <ul v-if="filtered.length" class="search-results">
          <li v-for="product in filtered" :key="product.id" @click="addProduct(product)">
            <span>{{ product.name }}</span>
            <span>{{ formatPrice(product.priceCents, locale) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <p v-if="message" class="checkout-message">{{ message }}</p>

    <table class="cart-table">
      <thead>
        <tr>
          <th>{{ t('checkout.table.product') }}</th>
          <th>{{ t('checkout.table.unitPrice') }}</th>
          <th>{{ t('checkout.table.quantity') }}</th>
          <th>{{ t('checkout.table.lineTotal') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="line in cart.lines" :key="line.product.id">
          <td>{{ line.product.name }}</td>
          <td>{{ formatPrice(line.product.priceCents, locale) }}</td>
          <td class="quantity-cell">
            <button type="button" @click="changeQuantity(line.product.id, -1)">-</button>
            {{ line.quantity }}
            <button type="button" @click="changeQuantity(line.product.id, 1)">+</button>
          </td>
          <td>{{ formatPrice(line.product.priceCents * line.quantity, locale) }}</td>
          <td>
            <button type="button" class="danger" @click="cart.removeProduct(line.product.id)">
              {{ t('common.delete') }}
            </button>
          </td>
        </tr>
        <tr v-if="cart.lines.length === 0">
          <td colspan="5" class="empty">{{ t('checkout.emptyCart') }}</td>
        </tr>
      </tbody>
    </table>

    <footer class="checkout-footer">
      <span class="total"
        >{{ t('checkout.total') }}: {{ formatPrice(cart.totalCents, locale) }}</span
      >
      <button
        type="button"
        class="primary"
        :disabled="cart.lines.length === 0 || completing"
        @click="completeSale"
      >
        {{ t('checkout.completeSale') }}
      </button>
    </footer>
  </section>
</template>

<style scoped>
.lookup-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.barcode-form {
  display: flex;
  gap: 8px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-box input {
  width: 100%;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-top: 4px;
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
}

.search-results li {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: pointer;
}

.search-results li:hover {
  background: var(--color-bg-mute);
}

.checkout-message {
  margin-bottom: 12px;
  color: var(--color-text-soft);
  font-size: 13px;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
}

.cart-table th,
.cart-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
}

.cart-table .quantity-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-table .empty {
  text-align: center;
  color: var(--color-text-soft);
}

.checkout-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 20px;
}

.checkout-footer .total {
  font-size: 18px;
  font-weight: 700;
}
</style>
