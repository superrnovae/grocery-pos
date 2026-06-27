import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n'
import { useSettingsStore } from './stores/settings'
import { useOnlineStore } from './stores/online'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

useOnlineStore().init()

useSettingsStore()
  .load()
  .catch((error: unknown) => {
    console.error('Failed to load settings, falling back to defaults', error)
  })
  .finally(() => {
    app.mount('#app')
  })
