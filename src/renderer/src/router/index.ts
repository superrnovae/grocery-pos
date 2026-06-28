import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/caisse' },
    {
      path: '/tableau-de-bord',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue')
    },
    { path: '/caisse', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/produits', name: 'products', component: () => import('../views/ProductsView.vue') },
    {
      path: '/historique',
      name: 'sales-history',
      component: () => import('../views/SalesHistoryView.vue')
    },
    {
      path: '/historique/:id',
      name: 'receipt',
      component: () => import('../views/ReceiptView.vue'),
      props: true
    },
    {
      path: '/clients',
      name: 'customers',
      component: () => import('../views/CustomersView.vue')
    },
    { path: '/parametres', name: 'settings', component: () => import('../views/SettingsView.vue') }
  ]
})
