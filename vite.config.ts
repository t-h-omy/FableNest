import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/FableNest/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Fabelnest',
        short_name: 'Fabelnest',
        description: 'Ein gemütliches Zuhause für dein Fantasiewesen.',
        theme_color: '#110e2b',
        background_color: '#110e2b',
        display: 'standalone',
        start_url: '.',
        lang: 'de',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{css,html,ico,js,json,png,svg,webmanifest,webp,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    restoreMocks: true,
  },
})
