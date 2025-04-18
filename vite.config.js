import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      devTools: process.env.NODE_ENV === 'development'
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },server: {
    allowedHosts: ['8n2h7k.natappfree.cc'], // ← 添加这行
    host: '0.0.0.0', // ← 可选，让服务监听所有 IP，便于外部访问
    port: 5173        // ← 可选，指定端口
  }
})
