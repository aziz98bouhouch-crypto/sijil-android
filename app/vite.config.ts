import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
    assetsInlineLimit: 2048,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
  },
});
