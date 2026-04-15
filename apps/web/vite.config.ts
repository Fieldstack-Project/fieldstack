import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/setup": "http://localhost:3000",
      "/core": "http://localhost:3000",
      "/auth": "http://localhost:3000",
      "/api": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
