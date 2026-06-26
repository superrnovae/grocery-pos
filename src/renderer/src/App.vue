<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OnlineIndicator from './components/OnlineIndicator.vue'

const { t } = useI18n()
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <span class="app-title">Grocery POS</span>
      <nav class="app-nav">
        <router-link to="/caisse">{{ t('nav.checkout') }}</router-link>
        <router-link to="/produits">{{ t('nav.products') }}</router-link>
        <router-link to="/historique">{{ t('nav.history') }}</router-link>
        <router-link to="/parametres">{{ t('nav.settings') }}</router-link>
      </nav>
      <OnlineIndicator />
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-soft);
}

.app-title {
  font-weight: 700;
  font-size: 16px;
}

.app-nav {
  display: flex;
  gap: 16px;
  flex: 1;
}

.app-nav a {
  color: var(--color-text-soft);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 6px 4px;
  border-bottom: 2px solid transparent;
}

.app-nav a:hover {
  color: var(--color-text);
}

.app-nav a.router-link-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.app-main {
  flex: 1;
  padding: 24px;
}
</style>
