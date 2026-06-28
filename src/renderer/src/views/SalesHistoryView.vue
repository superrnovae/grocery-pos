<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSalesStore } from '../stores/sales'
import { formatPrice } from '../utils/format'
import type { SalesListFilter } from '@shared/ipc-contract'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
const route = useRoute()
const router = useRouter()
const sales = useSalesStore()
const exporting = ref(false)
const statusMessage = ref('')
const fromDate = ref('')
const toDate = ref('')
const customerId = ref(
  typeof route.query.customerId === 'string' ? Number(route.query.customerId) : undefined
)

applyFilter()

function buildFilter(): SalesListFilter {
  const filter: SalesListFilter = {}
  if (fromDate.value) filter.fromDate = `${fromDate.value}T00:00:00.000Z`
  if (toDate.value) filter.toDate = `${toDate.value}T23:59:59.999Z`
  if (customerId.value != null) filter.customerId = customerId.value
  return filter
}

function clearCustomerFilter(): void {
  customerId.value = undefined
  router.replace({ name: 'sales-history' })
  applyFilter()
}

async function applyFilter(): Promise<void> {
  try {
    await sales.load(buildFilter())
  } catch (error) {
    console.error('Failed to load sales', error)
    statusMessage.value = t('common.loadError')
  }
}

function filterToday(): void {
  const today = new Date().toISOString().slice(0, 10)
  fromDate.value = today
  toDate.value = today
  applyFilter()
}

function clearFilter(): void {
  fromDate.value = ''
  toDate.value = ''
  applyFilter()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

function openReceipt(id: number): void {
  router.push({ name: 'receipt', params: { id: String(id) } })
}

async function exportCsv(): Promise<void> {
  exporting.value = true
  try {
    await window.api.exportApi.salesCsv(buildFilter())
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

    <div class="flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1.5">
        <Label for="history-from">{{ t('history.from') }}</Label>
        <Input
          id="history-from"
          v-model="fromDate"
          type="date"
          class="w-40"
          @change="applyFilter"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="history-to">{{ t('history.to') }}</Label>
        <Input id="history-to" v-model="toDate" type="date" class="w-40" @change="applyFilter" />
      </div>
      <Button type="button" variant="outline" @click="filterToday">{{ t('history.today') }}</Button>
      <Button type="button" variant="ghost" @click="clearFilter">{{
        t('history.clearFilter')
      }}</Button>
    </div>

    <Alert v-if="customerId != null">
      <AlertDescription class="flex items-center justify-between">
        <span>{{ t('history.filteredByCustomer') }}</span>
        <Button type="button" variant="ghost" size="sm" @click="clearCustomerFilter">
          {{ t('history.clearFilter') }}
        </Button>
      </AlertDescription>
    </Alert>

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
