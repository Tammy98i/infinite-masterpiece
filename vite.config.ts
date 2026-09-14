import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react';
            if (id.includes('node_modules/react-router')) return 'react';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            if (id.includes('node_modules/motion') || id.includes('node_modules/lucide-react')) return 'ui';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Dual-stack (::) so localhost / ::1 and 127.0.0.1 both hit Vite.
      // host 0.0.0.0 is IPv4-only and Chromium then reports localhost refused (-102).
      host: '::',
      port: 3002,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: true,
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.API_PORT || 3001}`,
          changeOrigin: true,
          timeout: 0,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res) => {
              const socket = res as { writeHead?: (code: number, headers: Record<string, string>) => void; end?: (body: string) => void };
              if (socket.writeHead && socket.end) {
                socket.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                socket.end(JSON.stringify({ error: 'השרת לא זמין. הריצו npm run server ואז נסו שוב.' }));
              }
            });
          },
        },
        '/uploads': {
          target: `http://localhost:${process.env.API_PORT || 3001}`,
          changeOrigin: true,
        },
      },
    },
  };
});
