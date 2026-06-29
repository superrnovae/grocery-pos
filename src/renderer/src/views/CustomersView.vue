<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCustomersStore } from '../stores/customers'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
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

const { t } = useI18n()
const router = useRouter()
const customers = useCustomersStore()

const search = ref('')
const statusMessage = ref('')
const formOpen = ref(false)
const formName = ref('')
const formPhone = ref('')
const formError = ref('')
const saving = ref(false)

onMounted(async () => {
  if (customers.loaded) return
  try {
    await customers.load()
  } catch (error) {
    console.error('Failed to load customers', error)
    statusMessage.value = t('common.loadError')
  }
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return customers.items
  return customers.items.filter(
    (customer) =>
      customer.name.toLowerCase().includes(query) || (customer.phone ?? '').includes(query)
  )
})

function openForm(): void {
  formName.value = ''
  formPhone.value = ''
  formError.value = ''
  formOpen.value = true
}

async function submitForm(): Promise<void> {
  const name = formName.value.trim()
  if (!name) {
    formError.value = t('customers.form.errors.nameRequired')
    return
  }

  saving.value = true
  try {
    await customers.create({ name, phone: formPhone.value.trim() || null })
    formOpen.value = false
  } catch (error) {
    console.error('Create customer failed', error)
    formError.value = /UNIQUE constraint failed/i.test(String(error))
      ? t('customers.form.errors.duplicatePhone')
      : t('customers.saveError')
  } finally {
    saving.value = false
  }
}

function viewSales(customerId: number): void {
  router.push({ name: 'sales-history', query: { customerId: String(customerId) } })
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-xl font-bold">{{ t('nav.customers') }}</h1>

    <header class="flex flex-wrap items-center gap-3">
      <Input
        v-model="search"
        type="search"
        :placeholder="t('customers.searchPlaceholder')"
        class="max-w-xs"
      />
      <Button type="button" variant="outline" class="ml-auto" @click="openForm">
        {{ t('customers.addCustomer') }}
      </Button>
    </header>

    <Alert v-if="statusMessage">
      <AlertDescription>{{ statusMessage }}</AlertDescription>
    </Alert>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t('customers.table.name') }}</TableHead>
          <TableHead>{{ t('customers.table.phone') }}</TableHead>
          <TableHead>{{ t('customers.table.points') }}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="customer in filtered" :key="customer.id">
          <TableCell>{{ customer.name }}</TableCell>
          <TableCell>{{ customer.phone ?? '—' }}</TableCell>
          <TableCell>{{ customer.points }}</TableCell>
          <TableCell>
            <Button type="button" variant="ghost" size="sm" @click="viewSales(customer.id)">
              {{ t('customers.viewSales') }}
            </Button>
          </TableCell>
        </TableRow>
        <TableRow v-if="filtered.length === 0">
          <TableCell colspan="4" class="text-muted-foreground text-center">
            {{ t('customers.empty') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Dialog :open="formOpen" @update:open="(open) => !open && (formOpen = false)">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('customers.form.title') }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-4">
          <div class="grid gap-1.5">
            <Label for="customer-name">{{ t('customers.form.name') }}</Label>
            <Input id="customer-name" v-model="formName" type="text" autofocus />
          </div>
          <div class="grid gap-1.5">
            <Label for="customer-phone">{{ t('customers.form.phone') }}</Label>
            <Input id="customer-phone" v-model="formPhone" type="text" />
          </div>
        </div>

        <Alert v-if="formError" variant="destructive">
          <AlertDescription>{{ formError }}</AlertDescription>
        </Alert>

        <DialogFooter>
          <Button type="button" variant="outline" @click="formOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button type="button" :disabled="saving" @click="submitForm">
            {{ t('common.save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
