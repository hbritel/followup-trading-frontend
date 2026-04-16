import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    global: 'globalThis',
  },
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:9870',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:9870',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
