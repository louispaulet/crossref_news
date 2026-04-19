import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const projectDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = mode === 'production' ? env.VITE_BASE_PATH || '/crossref_news/' : '/'
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8787'

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(projectDir, 'src'),
      },
    },
  }
})
