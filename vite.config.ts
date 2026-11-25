import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // "/" for Vercel and local preview. GitHub Pages sets this to "/<repo>/".
  const base = process.env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [react()],
    define: {
      __HAL_AGENT_WS_URL__: JSON.stringify(env.VITE_HAL_AGENT_WS_URL || ''),
      __HAL_BASE_URL__: JSON.stringify(base),
      __HAL_DEV__: JSON.stringify(mode === 'development'),
    },
    build: {
      target: 'baseline-widely-available',
      minify: true,
      sourcemap: false,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor',
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              },
            ],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
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
