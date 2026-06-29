<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pencil, Trash2 } from '@lucide/vue'
import { useProductsStore } from '../stores/products'
import { formatPrice } from '../utils/format'
import type { BulkImportSummary, NewProduct, Product } from '@shared/types'
import ProductFormModal from '../components/ProductFormModal.vue'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Progress } from '../components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

interface ModalState {
  title: string
  initial: NewProduct
  barcodeEditable: boolean
  editingId?: number
}

const { t, locale } = useI18n()
const products = useProductsStore()

const search = ref('')
const barcodeInput = ref('')
const lookupBusy = ref(false)
const statusMessage = ref('')
const modal = ref<ModalState | null>(null)

const importOpen = ref(false)
const importBusy = ref(false)
const importProgress = ref<{ processed: number; total: number } | null>(null)
const importSummary = ref<BulkImportSummary | null>(null)
const importError = ref('')

const unsubscribeImportProgress = window.api.products.onImportProgress((progress) => {
  importProgress.value = progress
})

onMounted(async () => {
  if (products.loaded) return
  try {
    await products.load()
  } catch (error) {
    console.error('Failed to load products', error)
    statusMessage.value = t('common.loadError')
  }
})

onUnmounted(() => {
  unsubscribeImportProgress()
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return products.items
  return products.items.filter(
    (product) =>
      product.name.toLowerCase().includes(query) || (product.barcode ?? '').includes(query)
  )
})

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

function isDuplicateBarcodeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /UNIQUE constraint failed/i.test(error.message) &&
    /barcode/i.test(error.message)
  )
}

async function onSave(input: NewProduct): Promise<void> {
  try {
    if (modal.value?.editingId) {
      await products.update(modal.value.editingId, input)
    } else {
      await products.create(input)
    }
    modal.value = null
    statusMessage.value = ''
  } catch (error) {
    console.error('Save product failed', error)
    statusMessage.value = isDuplicateBarcodeError(error)
      ? t('products.form.errors.duplicateBarcode')
      : t('products.saveError')
  }
}

async function onDelete(product: Product): Promise<void> {
  if (!window.confirm(t('products.confirmDelete', { name: product.name }))) return
  try {
    await products.remove(product.id)
  } catch (error) {
    console.error('Delete product failed', error)
    statusMessage.value = t('products.deleteError')
  }
}

async function lookupBarcode(): Promise<void> {
  const barcode = barcodeInput.value.trim()
  if (!barcode) return

  lookupBusy.value = true
  statusMessage.value = ''

  try {
    const existing = await window.api.products.findByBarcode(barcode)
    if (existing) {
      statusMessage.value = t('products.lookup.alreadyExists', { name: existing.name })
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
      statusMessage.value = t('products.lookup.foundOnline')
    } else {
      modal.value = {
        title: t('products.form.titleCreate'),
        initial: blankProduct(barcode),
        barcodeEditable: false
      }
      statusMessage.value = t('products.lookup.notFoundOnline')
    }
  } catch (error) {
    console.error('Barcode lookup failed', error)
    statusMessage.value = t('products.lookup.error')
  } finally {
    lookupBusy.value = false
    barcodeInput.value = ''
  }
}

function openImport(): void {
  importSummary.value = null
  importProgress.value = null
  importError.value = ''
  importOpen.value = true
}

async function runImport(): Promise<void> {
  importBusy.value = true
  importError.value = ''
  importSummary.value = null
  importProgress.value = null

  try {
    const summary = await window.api.products.bulkImport()
    if (summary) {
      importSummary.value = summary
      await products.load()
    }
  } catch (error) {
    console.error('Bulk import failed', error)
    importError.value = t('products.import.error')
  } finally {
    importBusy.value = false
  }
}

function closeImport(): void {
  importOpen.value = false
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-xl font-bold">{{ t('nav.products') }}</h1>

    <header class="flex flex-wrap items-center gap-3">
      <Input
        v-model="search"
        type="search"
        :placeholder="t('products.searchPlaceholder')"
        class="max-w-xs"
      />
      <form class="flex gap-2" @submit.prevent="lookupBarcode">
        <Input
          v-model="barcodeInput"
          type="text"
          :placeholder="t('products.barcodePlaceholder')"
          :disabled="lookupBusy"
          class="w-56"
        />
        <Button type="submit" :disabled="lookupBusy">{{ t('products.lookupButton') }}</Button>
      </form>
      <Button type="button" variant="outline" class="ml-auto" @click="openImport">
        {{ t('products.importCatalog') }}
      </Button>
      <Button type="button" variant="outline" @click="openCreateBlank">
        {{ t('products.addManually') }}
      </Button>
    </header>

    <Alert v-if="statusMessage">
      <AlertDescription>{{ statusMessage }}</AlertDescription>
    </Alert>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t('products.table.name') }}</TableHead>
          <TableHead>{{ t('products.table.brand') }}</TableHead>
          <TableHead>{{ t('products.table.barcode') }}</TableHead>
          <TableHead>{{ t('products.table.price') }}</TableHead>
          <TableHead>{{ t('products.table.source') }}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="product in filtered" :key="product.id">
          <TableCell>{{ product.name }}</TableCell>
          <TableCell>{{ product.brand ?? '—' }}</TableCell>
          <TableCell>{{ product.barcode ?? '—' }}</TableCell>
          <TableCell>{{ formatPrice(product.priceCents, locale) }}</TableCell>
          <TableCell>
            <Badge :variant="product.source === 'manual' ? 'secondary' : 'default'">
              {{ t(`products.source.${product.source}`) }}
            </Badge>
          </TableCell>
          <TableCell>
            <div class="flex gap-2">
              <Button type="button" variant="ghost" size="sm" @click="openEdit(product)">
                <Pencil class="size-4" />
                {{ t('common.edit') }}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                @click="onDelete(product)"
              >
                <Trash2 class="size-4" />
                {{ t('common.delete') }}
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="filtered.length === 0">
          <TableCell colspan="6" class="text-muted-foreground text-center">
            {{ t('products.empty') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <ProductFormModal
      v-if="modal"
      :title="modal.title"
      :initial="modal.initial"
      :barcode-editable="modal.barcodeEditable"
      @save="onSave"
      @cancel="modal = null"
    />

    <Dialog :open="importOpen" @update:open="(open) => !open && closeImport()">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('products.import.title') }}</DialogTitle>
        </DialogHeader>

        <p class="text-muted-foreground text-sm">{{ t('products.import.description') }}</p>

        <Progress
          v-if="importBusy && importProgress"
          :model-value="importProgress.processed"
          :max="importProgress.total"
        />
        <p v-if="importBusy && importProgress" class="text-muted-foreground text-sm">
          {{ t('products.import.progress', importProgress) }}
        </p>

        <Alert v-if="importSummary">
          <AlertDescription>
            <p>{{ t('products.import.summary', importSummary) }}</p>
            <template v-if="importSummary.errors.length > 0">
              <p class="mt-2 font-medium">
                {{ t('products.import.errorsTitle', { count: importSummary.errors.length }) }}
              </p>
              <ul class="mt-1 list-disc pl-5">
                <li v-for="(error, index) in importSummary.errors" :key="index">{{ error }}</li>
              </ul>
            </template>
          </AlertDescription>
        </Alert>

        <Alert v-if="importError" variant="destructive">
          <AlertDescription>{{ importError }}</AlertDescription>
        </Alert>

        <DialogFooter>
          <Button type="button" variant="outline" @click="closeImport">
            {{ t('products.import.close') }}
          </Button>
          <Button type="button" :disabled="importBusy" @click="runImport">
            {{ t('products.import.choose') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
