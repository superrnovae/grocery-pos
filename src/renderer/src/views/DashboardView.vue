<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '../stores/analytics'
import { formatPrice } from '../utils/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'

const { t, locale } = useI18n()
const analytics = useAnalyticsStore()
const statusMessage = ref('')

onMounted(async () => {
  try {
    await analytics.load()
  } catch (error) {
    console.error('Failed to load dashboard stats', error)
    statusMessage.value = t('common.loadError')
  }
})

const changePercent = computed(() => {
  const stats = analytics.stats
  if (!stats || stats.yesterdayRevenueCents === 0) return null
  return Math.round(
    ((stats.todayRevenueCents - stats.yesterdayRevenueCents) / stats.yesterdayRevenueCents) * 100
  )
})

const changeVariant = computed(() => {
  if (changePercent.value === null || changePercent.value === 0) return 'secondary'
  return changePercent.value > 0 ? 'default' : 'destructive'
})

const maxQuantity = computed(() =>
  Math.max(1, ...(analytics.stats?.topProducts.map((product) => product.quantity) ?? [1]))
)
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-xl font-bold">{{ t('nav.dashboard') }}</h1>

    <Alert v-if="statusMessage">
      <AlertDescription>{{ statusMessage }}</AlertDescription>
    </Alert>

    <div v-if="analytics.stats" class="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardDescription>{{ t('dashboard.todayRevenue') }}</CardDescription>
          <CardTitle class="flex items-center gap-2 text-2xl">
            {{ formatPrice(analytics.stats.todayRevenueCents, locale) }}
            <Badge v-if="changePercent !== null" :variant="changeVariant">
              {{ changePercent > 0 ? '+' : '' }}{{ changePercent }}%
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>{{ t('dashboard.yesterdayRevenue') }}</CardDescription>
          <CardTitle class="text-2xl">
            {{ formatPrice(analytics.stats.yesterdayRevenueCents, locale) }}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Card v-if="analytics.stats">
      <CardHeader>
        <CardTitle>{{ t('dashboard.topProducts') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="analytics.stats.topProducts.length === 0" class="text-muted-foreground text-sm">
          {{ t('dashboard.noSales') }}
        </div>
        <div v-else class="flex flex-col gap-3">
          <div
            v-for="product in analytics.stats.topProducts"
            :key="product.name"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center justify-between text-sm">
              <span>{{ product.name }}</span>
              <span class="text-muted-foreground">{{ product.quantity }}</span>
            </div>
            <div class="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                class="bg-primary h-full rounded-full"
                :style="{ width: `${(product.quantity / maxQuantity) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
