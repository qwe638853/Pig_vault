import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/vault',
    name: 'Vault',
    component: () => import('../views/Vault.vue')
  },
  {
    path: '/earnings',
    name: 'Earnings',
    component: () => import('../views/Earnings.vue')
  },
  {
    path: '/circle-test',
    name: 'CircleTest',
    component: () => import('../views/CircleTest.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 