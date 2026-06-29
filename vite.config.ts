import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          audio: ['./src/services/AudioService.ts'],
          utils: [
            './src/utils/ImageMemoryManager.ts',
            './src/utils/PerformanceBaselines.ts',
            './src/utils/performance-monitoring.ts'
          ]
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 600,
    cssMinify: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@google/genai']
  }
})