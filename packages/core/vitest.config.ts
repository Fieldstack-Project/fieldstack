import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/utils/**/*.ts", "src/db/**/*.ts", "src/auth/totp.ts"],
      exclude: ["**/*.test.ts", "src/**/index.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
