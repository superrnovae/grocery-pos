<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NewProduct } from '@shared/types'

const props = defineProps<{
  title: string
  initial: NewProduct
  barcodeEditable: boolean
}>()

const emit = defineEmits<{
  save: [NewProduct]
  cancel: []
}>()

const { t } = useI18n()

const titleId = 'product-form-modal-title'

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('cancel')
}

const name = ref(props.initial.name)
const brand = ref(props.initial.brand ?? '')
const category = ref(props.initial.category ?? '')
const barcode = ref(props.initial.barcode ?? '')
const priceText = ref(
  props.initial.priceCents > 0 ? (props.initial.priceCents / 100).toFixed(2) : ''
)
const error = ref('')

function submit(): void {
  const trimmedName = name.value.trim()
  const price = Number.parseFloat(priceText.value.replace(',', '.'))

  if (!trimmedName) {
    error.value = t('products.form.errors.nameRequired')
    return
  }
  if (!Number.isFinite(price) || price <= 0) {
    error.value = t('products.form.errors.priceRequired')
    return
  }

  emit('save', {
    name: trimmedName,
    brand: brand.value.trim() || null,
    category: category.value.trim() || null,
    barcode: barcode.value.trim() || null,
    priceCents: Math.round(price * 100),
    imageUrl: props.initial.imageUrl,
    source: props.initial.source
  })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')" @keydown="onKeydown">
    <div class="modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <h2 :id="titleId">{{ title }}</h2>

      <img v-if="initial.imageUrl" :src="initial.imageUrl" class="preview" alt="" />

      <label>
        {{ t('products.form.name') }}
        <input v-model="name" type="text" autofocus />
      </label>
      <label>
        {{ t('products.form.brand') }}
        <input v-model="brand" type="text" />
      </label>
      <label>
        {{ t('products.form.category') }}
        <input v-model="category" type="text" />
      </label>
      <label>
        {{ t('products.form.barcode') }}
        <input v-model="barcode" type="text" :disabled="!barcodeEditable" />
      </label>
      <label>
        {{ t('products.form.price') }}
        <input v-model="priceText" type="text" inputmode="decimal" placeholder="0.00" />
      </label>

      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="modal-actions">
        <button type="button" @click="emit('cancel')">{{ t('common.cancel') }}</button>
        <button type="button" class="primary" @click="submit">{{ t('common.save') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 24px;
  width: 360px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal h2 {
  font-size: 18px;
}

.preview {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  align-self: center;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-soft);
}

.form-error {
  color: var(--color-danger);
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
