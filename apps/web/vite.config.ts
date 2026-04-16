import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true, // 0.0.0.0 — 로컬 네트워크에서 접속 가능
    proxy: {
      "/setup": "http://localhost:3000",
      "/core": "http://localhost:3000",
      "/auth": "http://localhost:3000",
      "/api": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
