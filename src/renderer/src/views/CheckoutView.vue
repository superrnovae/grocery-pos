<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Minus, Plus, Trash2 } from '@lucide/vue'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useSalesStore } from '../stores/sales'
import { formatPrice } from '../utils/format'
import type { Product } from '@shared/types'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

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
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap gap-4">
      <form class="flex gap-2" @submit.prevent="addByBarcode">
        <Input
          v-model="barcodeInput"
          type="text"
          :placeholder="t('checkout.barcodePlaceholder')"
          class="w-56"
        />
        <Button type="submit">{{ t('checkout.addButton') }}</Button>
      </form>
      <div class="relative min-w-56 flex-1">
        <Input
          v-model="search"
          type="search"
          :placeholder="t('checkout.searchPlaceholder')"
          @keydown.enter="addFirstFiltered"
        />
        <div
          v-if="filtered.length"
          class="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-md border shadow-md"
        >
          <button
            v-for="product in filtered"
            :key="product.id"
            type="button"
            class="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between px-3 py-2 text-sm"
            @click="addProduct(product)"
          >
            <span>{{ product.name }}</span>
            <span>{{ formatPrice(product.priceCents, locale) }}</span>
          </button>
        </div>
      </div>
    </div>

    <Alert v-if="message">
      <AlertDescription>{{ message }}</AlertDescription>
    </Alert>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t('checkout.table.product') }}</TableHead>
          <TableHead>{{ t('checkout.table.unitPrice') }}</TableHead>
          <TableHead>{{ t('checkout.table.quantity') }}</TableHead>
          <TableHead>{{ t('checkout.table.lineTotal') }}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="line in cart.lines" :key="line.product.id">
          <TableCell>{{ line.product.name }}</TableCell>
          <TableCell>{{ formatPrice(line.product.priceCents, locale) }}</TableCell>
          <TableCell>
            <div class="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="size-7"
                @click="changeQuantity(line.product.id, -1)"
              >
                <Minus class="size-3.5" />
              </Button>
              <span class="w-6 text-center">{{ line.quantity }}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="size-7"
                @click="changeQuantity(line.product.id, 1)"
              >
                <Plus class="size-3.5" />
              </Button>
            </div>
          </TableCell>
          <TableCell>{{ formatPrice(line.product.priceCents * line.quantity, locale) }}</TableCell>
          <TableCell>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="cart.removeProduct(line.product.id)"
            >
              <Trash2 class="size-4" />
              {{ t('common.delete') }}
            </Button>
          </TableCell>
        </TableRow>
        <TableRow v-if="cart.lines.length === 0">
          <TableCell colspan="5" class="text-muted-foreground text-center">
            {{ t('checkout.emptyCart') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <footer class="flex items-center justify-end gap-5">
      <span class="text-lg font-bold">
        {{ t('checkout.total') }}: {{ formatPrice(cart.totalCents, locale) }}
      </span>
      <Button
        type="button"
        size="lg"
        :disabled="cart.lines.length === 0 || completing"
        @click="completeSale"
      >
        {{ t('checkout.completeSale') }}
      </Button>
    </footer>
  </section>
</template>
