import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: '.vercel/output/static',
    emptyOutDir: true,
  },
  define: {
    __ZAPIER_WEBHOOK_URL__: mode === 'production' ? 'process.env.PUBLIC_ZAPIER_WEBHOOK_URL' : 'undefined',
  },
}));
