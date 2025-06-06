import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/analyze-jd-vs-resume': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/analyze-preview': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ['fd41bc72-9891-4803-aceb-cfffb86e858e-00-3gwlt3j6cl4fe.kirk.replit.dev'],
  },
});
