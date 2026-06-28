<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSalesStore } from '../stores/sales'
import { formatPrice } from '../utils/format'
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
const sales = useSalesStore()
const exporting = ref(false)
const statusMessage = ref('')

onMounted(async () => {
  if (sales.loaded) return
  try {
    await sales.load()
  } catch (error) {
    console.error('Failed to load sales', error)
    statusMessage.value = t('common.loadError')
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

function openReceipt(id: number): void {
  router.push({ name: 'receipt', params: { id: String(id) } })
}

async function exportCsv(): Promise<void> {
  exporting.value = true
  try {
    await window.api.exportApi.salesCsv({})
  } catch (error) {
    console.error('Export sales CSV failed', error)
    statusMessage.value = t('history.exportError')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-bold">{{ t('nav.history') }}</h1>
      <Button type="button" variant="outline" :disabled="exporting" @click="exportCsv">
        {{ t('history.exportCsv') }}
      </Button>
    </header>

    <Alert v-if="statusMessage">
      <AlertDescription>{{ statusMessage }}</AlertDescription>
    </Alert>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t('history.table.date') }}</TableHead>
          <TableHead>{{ t('history.table.items') }}</TableHead>
          <TableHead>{{ t('history.table.total') }}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="sale in sales.items"
          :key="sale.id"
          class="cursor-pointer"
          @click="openReceipt(sale.id)"
        >
          <TableCell>{{ formatDate(sale.createdAt) }}</TableCell>
          <TableCell>{{ sale.items.length }}</TableCell>
          <TableCell>{{ formatPrice(sale.totalCents, locale) }}</TableCell>
          <TableCell>
            <Button type="button" variant="ghost" size="sm" @click.stop="openReceipt(sale.id)">
              {{ t('history.viewReceipt') }}
            </Button>
          </TableCell>
        </TableRow>
        <TableRow v-if="sales.items.length === 0">
          <TableCell colspan="4" class="text-muted-foreground text-center">
            {{ t('history.empty') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </section>
</template>
