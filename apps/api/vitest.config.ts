import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/loader/**/*.ts", "src/cli/**/*.ts"],
      exclude: ["**/*.test.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
