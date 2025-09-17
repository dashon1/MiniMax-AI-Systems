import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-button', 
            '@radix-ui/react-input',
            '@radix-ui/react-card'
          ],
          'supabase': ['@supabase/supabase-js'],
          'animations': ['framer-motion'],
          'charts': ['chart.js', 'recharts']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'framer-motion'
    ]
  },
  esbuild: {
    legalComments: 'none',
    treeShaking: true
  }
})