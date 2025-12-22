import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import CatchRaise from '@/views/CatchRaise.vue'
import Stock from '@/views/Stock.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { title: '首页' },
    },
    {
      path: '/catch-raise',
      name: 'CatchRaise',
      component: CatchRaise,
      meta: { title: '涨跌捕捉', requiresAuth: false },
    },
    {
      path: '/stock',
      name: 'Stock',
      component: Stock,
      meta: { title: '单股查询' },
    },
  ],
})

function isAuthenticated(): boolean {
  // TODO: 替换为真实鉴权逻辑（如从 store / cookie / token 判断）
  return true
}

router.beforeEach((to, _from, next) => {
  const meta = (to.meta || {}) as any
  document.title = meta.title ? `${meta.title} - Stock Info` : 'Stock Info'

  if (meta.requiresAuth && !isAuthenticated()) {
    next({ path: '/' })
    return
  }
  next()
})

export default router
