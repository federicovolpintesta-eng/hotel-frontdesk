import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'HR Analytics Los Pinos',
        short_name: 'HR Analytics',
        description: 'Dashboard de Recursos Humanos y Evaluación de Personal',
        theme_color: '#111827',
        background_color: '#0B0F19',
        display: 'standalone',
        icons: [
          {
            src: '/images/los-pinos.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/los-pinos.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
