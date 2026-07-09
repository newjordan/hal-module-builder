import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      __HAL_AGENT_WS_URL__: JSON.stringify(env.VITE_HAL_AGENT_WS_URL || ''),
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 600,
      cssMinify: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});
