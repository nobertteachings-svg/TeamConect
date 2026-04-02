import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["./vitest.integration.setup.ts"],
    globalTeardown: "./vitest.integration.teardown.ts",
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    maxConcurrency: 1,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
