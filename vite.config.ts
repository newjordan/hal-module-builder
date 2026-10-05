import { resolve } from 'node:path';
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
        // The agent console + studio, and the Owl3D stereo portal.
        input: {
          main: resolve(__dirname, 'index.html'),
          owl3d: resolve(__dirname, 'owl3d.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            three: ['three'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // three.js is one ~700 kB chunk, loaded only by owl3d.html.
      chunkSizeWarningLimit: 800,
      cssMinify: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});
