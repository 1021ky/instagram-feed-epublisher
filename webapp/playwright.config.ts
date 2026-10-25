/**
 * @file Playwright configuration for E2E tests (Option A: Full-Stack BFF + OpenAPI Mock Server).
 *
 * Strategy:
 * 1. Automatically boot the OpenAPI-validated local Mock Instagram Server (`127.0.0.1:4010`).
 * 2. Boot an isolated Next.js HTTP server (`localhost:3100`) wired to the mock server via
 *    `META_GRAPH_API_BASE_URL` and `INSTAGRAM_OAUTH_*` environment variables so zero requests
 *    ever hit live Instagram servers, even if `pnpm dev` (`https://localhost:3000`) is running.
 */
import { defineConfig } from "@playwright/test";

const isCI = process.env.CI === "true";
const isHeadedCli = process.argv.includes("--headed");
const isFullReportRun =
  process.env.PLAYWRIGHT_FULL_REPORT === "1" ||
  process.env.npm_lifecycle_event === "e2etest:report" ||
  isHeadedCli;
const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO ?? (isHeadedCli ? 500 : 0));
const mockInstagramPort = Number(process.env.MOCK_INSTAGRAM_PORT ?? 4010);
const mockInstagramUrl = `http://127.0.0.1:${mockInstagramPort}`;
const e2eAppPort = Number(process.env.PLAYWRIGHT_APP_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${e2eAppPort}`;
const shouldStartServers = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: isCI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    [
      "./scripts/playwright-summary-reporter.mjs",
      {
        outputFile: "playwright-report/summary.md",
        printSummary: isFullReportRun,
      },
    ],
  ],
  use: {
    baseURL,
    browserName: "chromium",
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
    screenshot: !isCI && isFullReportRun ? "on" : "only-on-failure",
    trace: !isCI && isFullReportRun ? "on" : "retain-on-failure",
    video: !isCI && isFullReportRun ? "on" : "retain-on-failure",
  },
  webServer: shouldStartServers
    ? [
        {
          command: "node scripts/mock-instagram-server.mjs",
          url: `${mockInstagramUrl}/health`,
          reuseExistingServer: process.env.CI !== "true",
          timeout: 30_000,
          env: {
            ...process.env,
            MOCK_INSTAGRAM_PORT: String(mockInstagramPort),
            MOCK_INSTAGRAM_HOST: "127.0.0.1",
          },
        },
        {
          command: `node ./node_modules/next/dist/bin/next dev --port ${e2eAppPort} --hostname localhost`,
          url: baseURL,
          reuseExistingServer: process.env.CI !== "true",
          timeout: 180_000,
          env: {
            ...process.env,
            BETTER_AUTH_URL: baseURL,
            BETTER_AUTH_SECRET:
              process.env.BETTER_AUTH_SECRET ?? "e2e-test-secret-key-minimum-32-chars-long",
            INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID ?? "mock-ig-client-id",
            INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET ?? "mock-ig-client-secret",
            INSTAGRAM_OAUTH_AUTHORIZE_URL: `${mockInstagramUrl}/oauth/authorize`,
            INSTAGRAM_OAUTH_TOKEN_URL: `${mockInstagramUrl}/oauth/access_token`,
            META_GRAPH_API_BASE_URL: mockInstagramUrl,
          },
        },
      ]
    : undefined,
});
