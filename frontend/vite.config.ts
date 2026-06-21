import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [fileURLToPath(new URL('./src/__tests__/setup.ts', import.meta.url))],
    include: ['src/__tests__/**/*.test.tsx', 'src/__tests__/**/*.test.ts'],
  },
})
