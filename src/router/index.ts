import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import CatchRaise from '@/views/CatchRaise.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/catch-raise',
      name: 'CatchRaise',
      component: CatchRaise,
    },
  ],
})

export default router
