import path from "path";
import { fileURLToPath } from "url";

import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// modules/ 하위 파일들은 apps/web/node_modules에 접근할 수 없어
// Vite가 @fieldstack/* 패키지를 찾지 못한다.
// alias로 각 export 경로를 명시한다.
// 주의: 서브패스(controls/styles)를 베이스(controls)보다 먼저 선언해야
//       prefix 매칭 순서가 올바르게 동작한다.
// 모노레포 내부 패키지는 dist 대신 src를 직접 참조한다.
// Vite는 TypeScript를 네이티브로 처리하므로 빌드 단계가 불필요하고,
// 소스 변경이 즉시 HMR에 반영되며 dist 캐싱 문제가 발생하지 않는다.
const PACKAGES = path.resolve(__dirname, "../../packages");

export default defineConfig({
  resolve: {
    alias: {
      "@fieldstack/controls/styles": path.join(PACKAGES, "controls/src/styles/index.css"),
      "@fieldstack/controls": path.join(PACKAGES, "controls/src/index.ts"),
      "@fieldstack/core/browser": path.join(PACKAGES, "core/src/browser.ts"),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
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
