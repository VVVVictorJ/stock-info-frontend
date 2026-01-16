import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// #region agent log
fetch('http://127.0.0.1:7242/ingest/0ee4215d-6943-4299-947e-317aabad4cec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main.ts:app_bootstrap',message:'app bootstrap',data:{buildTime:__BUILD_TIME__,appVersion:__APP_VERSION__,gitSha:__GIT_SHA__},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1-cache-old-build'})}).catch(()=>{});
// #endregion
// #region agent log
fetch('http://127.0.0.1:7242/ingest/0ee4215d-6943-4299-947e-317aabad4cec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main.ts:env_snapshot',message:'env snapshot',data:{mode:import.meta.env.MODE,baseUrl:import.meta.env.BASE_URL,apiBase:import.meta.env.VITE_API_BASE_URL ?? '/api',origin:window.location.origin,href:window.location.href,baseURI:document.baseURI},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3-env-base-url'})}).catch(()=>{});
// #endregion

app.mount('#app')

router.isReady().then(() => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0ee4215d-6943-4299-947e-317aabad4cec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main.ts:router_ready',message:'router ready',data:{path:router.currentRoute.value.fullPath,name:router.currentRoute.value.name ?? null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2-wrong-branch-build'})}).catch(()=>{});
  // #endregion
})
