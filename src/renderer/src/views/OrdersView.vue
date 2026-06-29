<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Minus, Plus, Trash2 } from '@lucide/vue'
import { useProductsStore } from '../stores/products'
import { useOrdersStore } from '../stores/orders'
import { formatPrice } from '../utils/format'
import type { OrderStatus, Product } from '@shared/types'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Badge, type BadgeVariants } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

const { t, locale } = useI18n()
const products = useProductsStore()
const orders = useOrdersStore()

const statusMessage = ref('')
const customerName = ref('')
const customerPhone = ref('')
const search = ref('')
const orderLines = ref<{ product: Product; quantity: number }[]>([])
const creating = ref(false)

const STATUS_VARIANT: Record<OrderStatus, NonNullable<BadgeVariants['variant']>> = {
  pending: 'secondary',
  in_progress: 'default',
  delivered: 'outline'
}

onMounted(async () => {
  try {
    if (!products.loaded) await products.load()
    if (!orders.loaded) await orders.load()
  } catch (error) {
    console.error('Failed to load orders page data', error)
    statusMessage.value = t('common.loadError')
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

const orderTotalCents = computed(() =>
  orderLines.value.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0)
)

function addProduct(product: Product): void {
  const existing = orderLines.value.find((line) => line.product.id === product.id)
  if (existing) existing.quantity += 1
  else orderLines.value.push({ product, quantity: 1 })
  search.value = ''
}

function changeQuantity(productId: number, delta: number): void {
  const line = orderLines.value.find((l) => l.product.id === productId)
  if (!line) return
  const next = line.quantity + delta
  if (next <= 0) {
    orderLines.value = orderLines.value.filter((l) => l.product.id !== productId)
  } else {
    line.quantity = next
  }
}

function removeLine(productId: number): void {
  orderLines.value = orderLines.value.filter((line) => line.product.id !== productId)
}

async function createOrder(): Promise<void> {
  if (orderLines.value.length === 0 || creating.value || !customerName.value.trim()) return
  creating.value = true
  try {
    await orders.create({
      customerName: customerName.value,
      customerPhone: customerPhone.value.trim() || null,
      items: orderLines.value.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity
      }))
    })
    customerName.value = ''
    customerPhone.value = ''
    orderLines.value = []
    statusMessage.value = ''
  } catch (error) {
    console.error('Create order failed', error)
    statusMessage.value = t('orders.createError')
  } finally {
    creating.value = false
  }
}

async function changeStatus(orderId: number, status: string): Promise<void> {
  try {
    await orders.updateStatus(orderId, status as OrderStatus)
  } catch (error) {
    console.error('Update order status failed', error)
    statusMessage.value = t('orders.statusError')
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-xl font-bold">{{ t('nav.orders') }}</h1>

    <Alert v-if="statusMessage">
      <AlertDescription>{{ statusMessage }}</AlertDescription>
    </Alert>

    <div class="flex flex-col gap-3 rounded-md border p-4">
      <div class="flex flex-wrap gap-3">
        <div class="flex flex-col gap-1.5">
          <Label for="order-customer-name">{{ t('orders.form.customerName') }}</Label>
          <Input id="order-customer-name" v-model="customerName" type="text" class="w-48" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="order-customer-phone">{{ t('orders.form.customerPhone') }}</Label>
          <Input id="order-customer-phone" v-model="customerPhone" type="text" class="w-40" />
        </div>
        <div class="relative flex min-w-56 flex-1 flex-col gap-1.5">
          <Label for="order-search">{{ t('orders.form.addProduct') }}</Label>
          <Input
            id="order-search"
            v-model="search"
            type="search"
            :placeholder="t('checkout.searchPlaceholder')"
          />
          <div
            v-if="filtered.length"
            class="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-md border shadow-md"
          >
            <button
              v-for="product in filtered"
              :key="product.id"
              type="button"
              class="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-none border-0 bg-transparent px-3 py-2 text-left text-sm"
              @click="addProduct(product)"
            >
              <span>{{ product.name }}</span>
              <span>{{ formatPrice(product.priceCents, locale) }}</span>
            </button>
          </div>
        </div>
      </div>

      <Table v-if="orderLines.length > 0">
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('checkout.table.product') }}</TableHead>
            <TableHead>{{ t('checkout.table.quantity') }}</TableHead>
            <TableHead>{{ t('checkout.table.lineTotal') }}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="line in orderLines" :key="line.product.id">
            <TableCell>{{ line.product.name }}</TableCell>
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
            <TableCell>{{
              formatPrice(line.product.priceCents * line.quantity, locale)
            }}</TableCell>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                @click="removeLine(line.product.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div class="flex items-center justify-end gap-4">
        <span v-if="orderLines.length > 0" class="font-semibold">
          {{ t('checkout.total') }}: {{ formatPrice(orderTotalCents, locale) }}
        </span>
        <Button
          type="button"
          :disabled="orderLines.length === 0 || !customerName.trim() || creating"
          @click="createOrder"
        >
          {{ t('orders.form.create') }}
        </Button>
      </div>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t('orders.table.date') }}</TableHead>
          <TableHead>{{ t('orders.table.customer') }}</TableHead>
          <TableHead>{{ t('orders.table.items') }}</TableHead>
          <TableHead>{{ t('orders.table.total') }}</TableHead>
          <TableHead>{{ t('orders.table.status') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="order in orders.items" :key="order.id">
          <TableCell>{{ formatDate(order.createdAt) }}</TableCell>
          <TableCell>{{ order.customerName }}</TableCell>
          <TableCell>{{ order.items.length }}</TableCell>
          <TableCell>{{ formatPrice(order.totalCents, locale) }}</TableCell>
          <TableCell>
            <div class="flex items-center gap-2">
              <Badge :variant="STATUS_VARIANT[order.status]">
                {{ t(`orders.status.${order.status}`) }}
              </Badge>
              <Select
                :model-value="order.status"
                @update:model-value="(value) => changeStatus(order.id, String(value))"
              >
                <SelectTrigger class="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{{ t('orders.status.pending') }}</SelectItem>
                  <SelectItem value="in_progress">{{ t('orders.status.in_progress') }}</SelectItem>
                  <SelectItem value="delivered">{{ t('orders.status.delivered') }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="orders.items.length === 0">
          <TableCell colspan="5" class="text-muted-foreground text-center">
            {{ t('orders.empty') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </section>
</template>
