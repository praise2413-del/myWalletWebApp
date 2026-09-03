import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes far less often than app code — splitting it into its
        // own chunks lets browsers cache it across deploys instead of redownloading
        // it every time app code changes. Recharts in particular is large enough
        // (~370kB) that it was otherwise getting bundled into (and named after) an
        // unrelated shared app module, which was both confusing and hurt caching.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts')) return 'vendor-charts'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('@react-pdf') || id.includes('fontkit') || id.includes('yoga-layout') || id.includes('restructure')) return 'vendor-pdf'
          if (/[/\\](react|react-dom|react-router-dom|scheduler)[/\\]/.test(id)) return 'vendor-react'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
