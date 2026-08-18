import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Path-based so it actually matches: the object form keyed on package
        // names ('react', 'react-dom') resolved only to the CJS entry stubs and
        // emitted an empty `vendor` chunk while the real code stayed in index.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/@mui/') || id.includes('/@emotion/')) return 'mui';
          // Framework runtime only. Sweeping *all* of node_modules in here would
          // pull lazily-imported libs (recharts et al.) into the eager payload.
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|react-redux|redux|redux-thunk|scheduler|@reduxjs)\//.test(id)) {
            return 'vendor';
          }
        },
      },
    },
  },
  envPrefix: 'VITE_',
})
