import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  server: {
    host: 'true',
    port: 5173,  // default port for frontend
  },
  plugins: [react()],
});
