<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSalesStore } from '../stores/sales'
import { formatPrice } from '../utils/format'
import type { Sale } from '@shared/types'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()
const sales = useSalesStore()

const sale = ref<Sale | null>(null)
const exporting = ref(false)
const statusMessage = ref('')

onMounted(async () => {
  try {
    sale.value = await sales.getById(Number(props.id))
  } catch (error) {
    console.error('Failed to load receipt', error)
    statusMessage.value = t('common.loadError')
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

async function exportPdf(): Promise<void> {
  if (!sale.value) return
  exporting.value = true
  try {
    await window.api.exportApi.receiptPdf(sale.value.id)
  } catch (error) {
    console.error('Export receipt PDF failed', error)
    statusMessage.value = t('history.exportError')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section v-if="sale" class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-bold">{{ t('history.receiptTitle', { id: sale.id }) }}</h1>
      <Button type="button" variant="outline" :disabled="exporting" @click="exportPdf">
        {{ t('history.exportPdf') }}
      </Button>
    </header>
    <p class="text-muted-foreground -mt-2 text-sm">{{ formatDate(sale.createdAt) }}</p>

    <Alert v-if="statusMessage">
      <AlertDescription>{{ statusMessage }}</AlertDescription>
    </Alert>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t('checkout.table.product') }}</TableHead>
          <TableHead>{{ t('checkout.table.quantity') }}</TableHead>
          <TableHead>{{ t('checkout.table.unitPrice') }}</TableHead>
          <TableHead>{{ t('checkout.table.lineTotal') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="item in sale.items" :key="item.id">
          <TableCell>{{ item.productNameSnapshot }}</TableCell>
          <TableCell>{{ item.quantity }}</TableCell>
          <TableCell>{{ formatPrice(item.unitPriceCentsSnapshot, locale) }}</TableCell>
          <TableCell>{{ formatPrice(item.lineTotalCents, locale) }}</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colspan="3">{{ t('checkout.total') }}</TableCell>
          <TableCell>{{ formatPrice(sale.totalCents, locale) }}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </section>
  <Alert v-else-if="statusMessage">
    <AlertDescription>{{ statusMessage }}</AlertDescription>
  </Alert>
  <p v-else class="text-muted-foreground">{{ t('history.notFound') }}</p>
</template>
