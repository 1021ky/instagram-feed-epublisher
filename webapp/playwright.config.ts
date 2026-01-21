/**
 * @file Playwright configuration for E2E tests.
 */
import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const shouldStartServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  retries: 2,
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: shouldStartServer
    ? {
        command: "pnpm --dir server dev",
        url: baseURL,
        reuseExistingServer: process.env.CI !== "true",
        timeout: 180_000,
      }
    : undefined,
});
