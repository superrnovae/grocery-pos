<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OnlineIndicator from './components/OnlineIndicator.vue'

const { t } = useI18n()

const links = [
  { to: '/caisse', label: 'nav.checkout' },
  { to: '/produits', label: 'nav.products' },
  { to: '/historique', label: 'nav.history' },
  { to: '/parametres', label: 'nav.settings' }
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="bg-card flex items-center gap-6 border-b px-5 py-3">
      <span class="text-base font-bold">Grocery POS</span>
      <nav class="flex flex-1 gap-5">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-muted-foreground hover:text-foreground border-b-2 border-transparent py-1 text-sm font-semibold no-underline [&.router-link-active]:border-primary [&.router-link-active]:text-primary"
        >
          {{ t(link.label) }}
        </router-link>
      </nav>
      <OnlineIndicator />
    </header>
    <main class="flex-1 p-6">
      <router-view />
    </main>
  </div>
</template>
