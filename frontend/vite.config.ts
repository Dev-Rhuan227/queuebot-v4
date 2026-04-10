import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Fundamental para conseguir amarrar da porta 3000 do container pro hospedeiro
    port: 3000,
  }
});
