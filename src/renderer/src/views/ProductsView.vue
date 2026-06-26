<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '../stores/products'
import type { NewProduct, Product } from '@shared/types'
import ProductFormModal from '../components/ProductFormModal.vue'

interface ModalState {
  title: string
  initial: NewProduct
  barcodeEditable: boolean
  editingId?: number
}

const { t } = useI18n()
const products = useProductsStore()

const search = ref('')
const barcodeInput = ref('')
const lookupBusy = ref(false)
const lookupMessage = ref('')
const modal = ref<ModalState | null>(null)

onMounted(() => {
  if (!products.loaded) products.load()
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return products.items
  return products.items.filter(
    (product) =>
      product.name.toLowerCase().includes(query) || (product.barcode ?? '').includes(query)
  )
})

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

function blankProduct(barcode: string | null = null): NewProduct {
  return {
    name: '',
    brand: null,
    category: null,
    barcode,
    priceCents: 0,
    imageUrl: null,
    source: 'manual'
  }
}

function openCreateBlank(): void {
  modal.value = {
    title: t('products.form.titleCreate'),
    initial: blankProduct(),
    barcodeEditable: true
  }
}

function openEdit(product: Product): void {
  modal.value = {
    title: t('products.form.titleEdit'),
    initial: { ...product },
    barcodeEditable: true,
    editingId: product.id
  }
}

async function onSave(input: NewProduct): Promise<void> {
  if (modal.value?.editingId) {
    await products.update(modal.value.editingId, input)
  } else {
    await products.create(input)
  }
  modal.value = null
}

async function onDelete(product: Product): Promise<void> {
  if (!window.confirm(t('products.confirmDelete', { name: product.name }))) return
  await products.remove(product.id)
}

async function lookupBarcode(): Promise<void> {
  const barcode = barcodeInput.value.trim()
  if (!barcode) return

  lookupBusy.value = true
  lookupMessage.value = ''

  try {
    const existing = await window.api.products.findByBarcode(barcode)
    if (existing) {
      lookupMessage.value = t('products.lookup.alreadyExists', { name: existing.name })
      openEdit(existing)
      return
    }

    const result = await window.api.lookup.byBarcode(barcode)
    if (result.found && result.product) {
      modal.value = {
        title: t('products.form.titleCreate'),
        initial: {
          name: result.product.name ?? '',
          brand: result.product.brand,
          category: result.product.category,
          barcode: result.product.barcode,
          priceCents: 0,
          imageUrl: result.product.imageUrl,
          source: 'openfoodfacts'
        },
        barcodeEditable: false
      }
      lookupMessage.value = t('products.lookup.foundOnline')
    } else {
      modal.value = {
        title: t('products.form.titleCreate'),
        initial: blankProduct(barcode),
        barcodeEditable: false
      }
      lookupMessage.value = t('products.lookup.notFoundOnline')
    }
  } finally {
    lookupBusy.value = false
    barcodeInput.value = ''
  }
}
</script>

<template>
  <section class="products-view">
    <header class="toolbar">
      <input v-model="search" type="search" :placeholder="t('products.searchPlaceholder')" />
      <form class="barcode-form" @submit.prevent="lookupBarcode">
        <input
          v-model="barcodeInput"
          type="text"
          :placeholder="t('products.barcodePlaceholder')"
          :disabled="lookupBusy"
        />
        <button type="submit" :disabled="lookupBusy">{{ t('products.lookupButton') }}</button>
      </form>
      <button type="button" class="primary" @click="openCreateBlank">
        {{ t('products.addManually') }}
      </button>
    </header>

    <p v-if="lookupMessage" class="lookup-message">{{ lookupMessage }}</p>

    <table class="products-table">
      <thead>
        <tr>
          <th>{{ t('products.table.name') }}</th>
          <th>{{ t('products.table.brand') }}</th>
          <th>{{ t('products.table.barcode') }}</th>
          <th>{{ t('products.table.price') }}</th>
          <th>{{ t('products.table.source') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in filtered" :key="product.id">
          <td>{{ product.name }}</td>
          <td>{{ product.brand ?? '—' }}</td>
          <td>{{ product.barcode ?? '—' }}</td>
          <td>{{ formatPrice(product.priceCents) }}</td>
          <td>{{ t(`products.source.${product.source}`) }}</td>
          <td class="actions">
            <button type="button" @click="openEdit(product)">{{ t('common.edit') }}</button>
            <button type="button" class="danger" @click="onDelete(product)">
              {{ t('common.delete') }}
            </button>
          </td>
        </tr>
        <tr v-if="filtered.length === 0">
          <td colspan="6" class="empty">{{ t('products.empty') }}</td>
        </tr>
      </tbody>
    </table>

    <ProductFormModal
      v-if="modal"
      :title="modal.title"
      :initial="modal.initial"
      :barcode-editable="modal.barcodeEditable"
      @save="onSave"
      @cancel="modal = null"
    />
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.barcode-form {
  display: flex;
  gap: 8px;
}

.lookup-message {
  margin-bottom: 12px;
  color: var(--color-text-soft);
  font-size: 13px;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
}

.products-table .actions {
  display: flex;
  gap: 8px;
}

.products-table .empty {
  text-align: center;
  color: var(--color-text-soft);
}
</style>
