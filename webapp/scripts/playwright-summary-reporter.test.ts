/**
 * @file Unit tests for Playwright static Markdown summary reporter.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import PlaywrightSummaryReporter, { stripAnsi } from "./playwright-summary-reporter.mjs";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("Playwright 静的 Markdown サマリーレポーター (PlaywrightSummaryReporter)", () => {
  it("ANSI エスケープコードを除去した上で静的 Markdown レポートを出力しプロセスをブロックしない", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-summary-test-"));
    tempDirs.push(tmpDir);
    const summaryPath = path.join(tmpDir, "playwright-report", "summary.md");

    const reporter = new PlaywrightSummaryReporter({
      outputFile: summaryPath,
      printSummary: false,
    });

    reporter.onBegin({ rootDir: "/repo/webapp" } as never);

    reporter.onTestEnd(
      {
        title: "ログイン後にハッシュタグ候補が表示される",
        retries: 0,
        location: { file: "/repo/webapp/e2e/hashtag-suggestions.spec.ts", line: 10, column: 3 },
        titlePath: () => [
          "",
          "e2e/hashtag-suggestions.spec.ts",
          "Step 1: ハッシュタグ自動補完・クイック選択機能",
          "ログイン後にハッシュタグ候補が表示される",
        ],
      } as never,
      {
        status: "passed",
        duration: 1230,
        retry: 0,
        errors: [],
      } as never,
    );

    reporter.onTestEnd(
      {
        title: "失敗時のエラー出力確認",
        retries: 0,
        location: { file: "/repo/webapp/e2e/sso-button.spec.ts", line: 8, column: 3 },
        titlePath: () => [
          "",
          "e2e/sso-button.spec.ts",
          "TOPページ（未ログイン時）",
          "失敗時のエラー出力確認",
        ],
      } as never,
      {
        status: "failed",
        duration: 450,
        retry: 0,
        errors: [{ message: "\u001B[31mExpected locator to be visible\u001B[39m" }],
      } as never,
    );

    reporter.onEnd({ status: "failed", duration: 1680 } as never);

    expect(stripAnsi("\u001B[32mok\u001B[39m")).toBe("ok");
    expect(fs.existsSync(summaryPath)).toBe(true);

    const content = fs.readFileSync(summaryPath, "utf8");
    expect(content).toContain("# Playwright E2E Test Report");
    expect(content).toContain("- **Overall Status**: FAILED");
    expect(content).toContain("- **Summary**: 1 passed, 1 failed, 0 skipped (2 total)");
    expect(content).toContain(
      "Step 1: ハッシュタグ自動補完・クイック選択機能 › ログイン後にハッシュタグ候補が表示される",
    );
    expect(content).toContain("Expected locator to be visible");
    expect(content).not.toContain("\u001B[31m");
  });
});
