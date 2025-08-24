import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import mkcert from "vite-plugin-mkcert";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",             // allows LAN/local
    port: 8080,
    strictPort: true,       // Force port 8080, don't fallback to other ports
    // HTTPS is handled by mkcert plugin
    proxy: {
      "/bluefin-api": {
        target: "https://dapi.api.sui-prod.bluefin.io", 
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/bluefin-api/, ""),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BluefinTrading/1.0)',
        },
      },
      "/bluefin-ws": {
        target: "wss://notifications.api.sui-prod.bluefin.io", 
        ws: true,
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/bluefin-ws/, ""),
      },
    },
  },
  plugins: [
    react(),
    ...(mode === 'development' ? [mkcert()] : []), // Only use HTTPS in development
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
          charts: ['recharts', 'lightweight-charts'],
        },
      },
    },
  },
}));



