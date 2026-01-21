import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // MUDE TEMPORARIAMENTE PARA autoUpdate
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      // Adicione estas configurações de workbox para forçar a limpeza
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        sourcemap: true
      },
      manifest: {
        name: "Escala das Servas",
        short_name: "Servas do Altar",
        description: "Gerenciamento da escala das servas do altar.",
        theme_color: "#e91e63",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020', // <--- Garanta que está es2020 ou esnext
  }
});