import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import CatchRaise from '@/views/CatchRaise/index.vue'
import Stock from '@/views/Stock.vue'
import TradeDateQuery from '@/views/TradeDateQuery/index.vue'
import PriceCompare from '@/views/PriceCompare/index.vue'
import TrackData from '@/views/TrackData/index.vue'
import DynamicBacktrack from '@/views/DynamicBacktrack/index.vue'
import WatchlistQuery from '@/views/WatchlistQuery/index.vue'
import SchedulerManage from '@/views/SchedulerManage/index.vue'
import TrendPrediction from '@/views/AiAnalysis/TrendPrediction/index.vue'

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
    {
      path: '/trade-date-query',
      name: 'TradeDateQuery',
      component: TradeDateQuery,
      meta: { title: '交易日查询' },
    },
    {
      path: '/price-compare',
      name: 'PriceCompare',
      component: PriceCompare,
      meta: { title: '价格对比' },
    },
    {
      path: '/track-data',
      name: 'TrackData',
      component: TrackData,
      meta: { title: '追踪数据' },
    },
    {
      path: '/dynamic-backtrack',
      name: 'DynamicBacktrack',
      component: DynamicBacktrack,
      meta: { title: '动态回溯' },
    },
    {
      path: '/watchlist-query',
      name: 'WatchlistQuery',
      component: WatchlistQuery,
      meta: { title: '观察表查询' },
    },
    {
      path: '/scheduler-manage',
      name: 'SchedulerManage',
      component: SchedulerManage,
      meta: { title: '定时任务管理' },
    },
    {
      path: '/ai-analysis/trend-prediction',
      name: 'TrendPrediction',
      component: TrendPrediction,
      meta: { title: '趋势预测' },
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
