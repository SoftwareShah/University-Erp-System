import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ command, mode }) => {
  const configDirectory = dirname(fileURLToPath(import.meta.url))
  const { VITE_API_URL = '' } = loadEnv(mode, configDirectory, 'VITE_')
  if (command === 'build' && VITE_API_URL) {
    let apiUrl
    try {
      apiUrl = new URL(VITE_API_URL)
    } catch {
      throw new Error('VITE_API_URL must be a valid HTTPS origin for production builds.')
    }
    if (
      VITE_API_URL !== VITE_API_URL.trim() ||
      apiUrl.protocol !== 'https:' ||
      apiUrl.pathname !== '/' ||
      apiUrl.search ||
      apiUrl.hash ||
      apiUrl.username ||
      apiUrl.password ||
      /localhost|127\.0\.0\.1/.test(apiUrl.hostname) ||
      /(^|\.)example\.(com|org|net)$/i.test(apiUrl.hostname)
    ) {
      throw new Error('VITE_API_URL must be a valid HTTPS backend origin, not a localhost or placeholder URL.')
    }
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
