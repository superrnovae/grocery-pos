<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NewProduct } from '@shared/types'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'

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

const name = ref(props.initial.name)
const brand = ref(props.initial.brand ?? '')
const category = ref(props.initial.category ?? '')
const barcode = ref(props.initial.barcode ?? '')
const priceText = ref(
  props.initial.priceCents > 0 ? (props.initial.priceCents / 100).toFixed(2) : ''
)
const error = ref('')

function onOpenChange(open: boolean): void {
  if (!open) emit('cancel')
}

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
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <img
        v-if="initial.imageUrl"
        :src="initial.imageUrl"
        alt=""
        class="mx-auto max-h-28 object-contain"
      />

      <div class="grid gap-4">
        <div class="grid gap-1.5">
          <Label for="product-name">{{ t('products.form.name') }}</Label>
          <Input id="product-name" v-model="name" type="text" autofocus />
        </div>
        <div class="grid gap-1.5">
          <Label for="product-brand">{{ t('products.form.brand') }}</Label>
          <Input id="product-brand" v-model="brand" type="text" />
        </div>
        <div class="grid gap-1.5">
          <Label for="product-category">{{ t('products.form.category') }}</Label>
          <Input id="product-category" v-model="category" type="text" />
        </div>
        <div class="grid gap-1.5">
          <Label for="product-barcode">{{ t('products.form.barcode') }}</Label>
          <Input id="product-barcode" v-model="barcode" type="text" :disabled="!barcodeEditable" />
        </div>
        <div class="grid gap-1.5">
          <Label for="product-price">{{ t('products.form.price') }}</Label>
          <Input
            id="product-price"
            v-model="priceText"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
          />
        </div>
      </div>

      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <DialogFooter>
        <Button type="button" variant="outline" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </Button>
        <Button type="button" @click="submit">{{ t('common.save') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
