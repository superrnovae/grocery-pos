<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { History, Package, Settings as SettingsIcon, ShoppingCart } from '@lucide/vue'
import OnlineIndicator from './components/OnlineIndicator.vue'

const { t } = useI18n()

const links = [
  { to: '/caisse', label: 'nav.checkout', icon: ShoppingCart },
  { to: '/produits', label: 'nav.products', icon: Package },
  { to: '/historique', label: 'nav.history', icon: History },
  { to: '/parametres', label: 'nav.settings', icon: SettingsIcon }
]
</script>

<template>
  <div class="flex h-screen">
    <aside class="bg-card flex w-56 shrink-0 flex-col border-r">
      <div class="px-5 py-4 text-base font-bold">Grocery POS</div>
      <nav class="flex flex-1 flex-col gap-1 px-3">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium no-underline [&.router-link-active]:bg-primary [&.router-link-active]:text-primary-foreground"
        >
          <component :is="link.icon" class="size-4" />
          {{ t(link.label) }}
        </router-link>
      </nav>
      <div class="border-t px-3 py-3">
        <OnlineIndicator />
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto p-6">
      <router-view />
    </main>
  </div>
</template>
