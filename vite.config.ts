import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
const buildTime = new Date().toISOString()
const appVersion = process.env.npm_package_version ?? 'unknown'
const gitSha = process.env.GITHUB_SHA?.slice(0, 7) ?? 'unknown'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_SHA__: JSON.stringify(gitSha),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
