import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const commonAlias = {
  "@": path.resolve(__dirname, "./src"),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: commonAlias,
        },
        esbuild: {
          jsx: "automatic",
        },
        test: {
          name: "small",
          globals: true,
          environment: "node",
          include: ["**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/*.browser.test.{ts,tsx}"],
          setupFiles: ["./vitest.setup.ts"],
          env: {
            NODE_ENV: "test",
          },
        },
      },
      {
        plugins: [react()],
        define: {
          "process.env": JSON.stringify({ NODE_ENV: "test" }),
        },
        resolve: {
          alias: {
            ...commonAlias,
            "next/link": path.resolve(__dirname, "./test-shims/next-link.tsx"),
            "next/image": path.resolve(__dirname, "./test-shims/next-image.tsx"),
          },
        },
        test: {
          name: "medium",
          globals: true,
          include: ["**/*.browser.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
          setupFiles: ["./vitest.browser.setup.ts"],
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
