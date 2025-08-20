import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import mkcert from "vite-plugin-mkcert";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",             // allows LAN/local
    port: 8080,
    // HTTPS is handled by mkcert plugin
    proxy: {
      "/bluefin-api": {
        target: "https://api.sui-prod.bluefin.io", 
        changeOrigin: true,
        secure: false,       // ignore invalid certs
        rewrite: (p) => p.replace(/^\/bluefin-api/, ""),
      },
      "/bluefin-ws": {
        target: "wss://notifications.api.sui-prod.bluefin.io", 
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/bluefin-ws/, ""),
      },
    },
  },
  plugins: [
    react(),
    mkcert(), // 👈 trustable local HTTPS certs
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));



