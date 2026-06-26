<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSalesStore } from '../stores/sales'

const { t } = useI18n()
const router = useRouter()
const sales = useSalesStore()
const exporting = ref(false)

onMounted(() => {
  if (!sales.loaded) sales.load()
})

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
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
    await window.api.exportApi.salesCsv({})
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="sales-history-view">
    <header class="toolbar">
      <h1>{{ t('nav.history') }}</h1>
      <button type="button" :disabled="exporting" @click="exportCsv">
        {{ t('history.exportCsv') }}
      </button>
    </header>

    <table class="sales-table">
      <thead>
        <tr>
          <th>{{ t('history.table.date') }}</th>
          <th>{{ t('history.table.items') }}</th>
          <th>{{ t('history.table.total') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="sale in sales.items"
          :key="sale.id"
          class="sale-row"
          @click="openReceipt(sale.id)"
        >
          <td>{{ formatDate(sale.createdAt) }}</td>
          <td>{{ sale.items.length }}</td>
          <td>{{ formatPrice(sale.totalCents) }}</td>
          <td>
            <button type="button" @click.stop="openReceipt(sale.id)">
              {{ t('history.viewReceipt') }}
            </button>
          </td>
        </tr>
        <tr v-if="sales.items.length === 0">
          <td colspan="4" class="empty">{{ t('history.empty') }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th,
.sales-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
}

.sale-row {
  cursor: pointer;
}

.sale-row:hover {
  background: var(--color-bg-mute);
}

.sales-table .empty {
  text-align: center;
  color: var(--color-text-soft);
}
</style>
