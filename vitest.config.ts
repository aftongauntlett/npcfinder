import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.config.js",
        "**/*.config.ts",
        "**/dist/",
        "**/.{idea,git,cache,output,temp}/",
      ],
    },
  },
});
