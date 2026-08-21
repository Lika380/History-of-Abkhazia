import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Офлайн-режим не нужен (см. ТЗ, 4.7) — сервис-воркер нужен только
      // для установки на главный экран, поэтому кэш не настраиваем.
      injectRegister: 'auto',
      manifest: {
        id: '/',
        name: 'История Абхазии — тренажёр',
        short_name: 'Абхазия',
        description: 'Тренажёр для подготовки к экзаменам и олимпиадам по истории Абхазии',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#3d7a44',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
