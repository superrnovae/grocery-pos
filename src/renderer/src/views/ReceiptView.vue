<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSalesStore } from '../stores/sales'
import { formatPrice } from '../utils/format'
import type { Sale } from '@shared/types'

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
  <section v-if="sale" class="receipt-view">
    <header class="toolbar">
      <h1>{{ t('history.receiptTitle', { id: sale.id }) }}</h1>
      <button type="button" :disabled="exporting" @click="exportPdf">
        {{ t('history.exportPdf') }}
      </button>
    </header>
    <p class="muted">{{ formatDate(sale.createdAt) }}</p>
    <p v-if="statusMessage" class="status-message">{{ statusMessage }}</p>

    <table class="receipt-table">
      <thead>
        <tr>
          <th>{{ t('checkout.table.product') }}</th>
          <th>{{ t('checkout.table.quantity') }}</th>
          <th>{{ t('checkout.table.unitPrice') }}</th>
          <th>{{ t('checkout.table.lineTotal') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in sale.items" :key="item.id">
          <td>{{ item.productNameSnapshot }}</td>
          <td>{{ item.quantity }}</td>
          <td>{{ formatPrice(item.unitPriceCentsSnapshot, locale) }}</td>
          <td>{{ formatPrice(item.lineTotalCents, locale) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">{{ t('checkout.total') }}</td>
          <td>{{ formatPrice(sale.totalCents, locale) }}</td>
        </tr>
      </tfoot>
    </table>
  </section>
  <p v-else-if="statusMessage" class="status-message">{{ statusMessage }}</p>
  <p v-else class="not-found">{{ t('history.notFound') }}</p>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.muted {
  color: var(--color-text-soft);
  font-size: 13px;
  margin-bottom: 16px;
}

.status-message {
  color: var(--color-text-soft);
  font-size: 13px;
  margin-bottom: 16px;
}

.receipt-table {
  width: 100%;
  border-collapse: collapse;
}

.receipt-table th,
.receipt-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
}

.receipt-table tfoot td {
  font-weight: 700;
  border-bottom: none;
  border-top: 2px solid var(--color-text);
}
</style>
