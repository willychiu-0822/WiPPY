import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: process.env.VITE_UAT_MODE === 'true' ? {
    proxy: {
      '/api': 'http://127.0.0.1:4122',
      '/scheduler': 'http://127.0.0.1:4122',
    },
  } : undefined,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [fileURLToPath(new URL('./src/__tests__/setup.ts', import.meta.url))],
    include: ['src/__tests__/**/*.test.tsx', 'src/__tests__/**/*.test.ts'],
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          const path = id.replaceAll('\\', '/');
          if (!path.includes('node_modules/')) return null;
          if (path.includes('/@firebase/firestore/') || path.includes('/firebase/firestore/') || path.includes('/@firebase/webchannel-wrapper/')) {
            return 'firebase-firestore';
          }
          if (path.includes('/@firebase/auth/') || path.includes('/firebase/auth/')) return 'firebase-auth';
          if (path.includes('/@firebase/') || path.includes('/firebase/')) return 'firebase';
          if (
            path.includes('/react-dom/') ||
            path.includes('/react-router-dom/') ||
            path.includes('/react-router/') ||
            path.includes('/scheduler/') ||
            path.includes('/react/')
          ) {
            return 'vendor';
          }
          return null;
        },
      },
    },
  },
})
