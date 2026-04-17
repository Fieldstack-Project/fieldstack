import path from "path";
import { fileURLToPath } from "url";

import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// modules/ 하위 파일들은 apps/web/node_modules에 접근할 수 없어
// Vite가 @fieldstack/* 패키지를 찾지 못한다.
// alias로 각 export 경로를 명시한다.
// 주의: 서브패스(controls/styles)를 베이스(controls)보다 먼저 선언해야
//       prefix 매칭 순서가 올바르게 동작한다.
const WEB_NODE_MODULES = path.resolve(__dirname, "node_modules");

export default defineConfig({
  resolve: {
    alias: {
      "@fieldstack/controls/styles": path.join(WEB_NODE_MODULES, "@fieldstack/controls/src/styles/index.css"),
      "@fieldstack/controls": path.join(WEB_NODE_MODULES, "@fieldstack/controls/dist/index.js"),
      "@fieldstack/core/browser": path.join(WEB_NODE_MODULES, "@fieldstack/core/dist/browser.js"),
    },
  },
  server: {
    host: true,
    proxy: {
      "/setup": "http://localhost:3000",
      "/core": "http://localhost:3000",
      "/auth": "http://localhost:3000",
      "/admin": "http://localhost:3000",
      "/api": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
