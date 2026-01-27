/**
 * @file Playwright configuration for E2E tests.
 *
 * This configuration follows Playwright's guidance on managing the web server:
 * https://playwright.dev/docs/test-webserver
 *
 * Strategy:
 * 1. Start a dev server automatically in CI when none is running.
 * 2. Reuse an already-running server during local development so you can keep `pnpm dev` alive.
 * 3. Keep test commands simple, no manual server lifecycle scripts are required.
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
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: process.env.CI !== "true",
        timeout: 180_000,
      }
    : undefined,
});
