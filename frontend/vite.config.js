import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em desenvolvimento não é preciso definir VITE_API_URL: /api é encaminhado
    // para o backend por este proxy.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          // A requisição sai do Vite, não do navegador: sem o header Origin o
          // backend a trata como same-origin e o CORS deixa de depender da
          // porta em que o dev server estiver rodando.
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
})
