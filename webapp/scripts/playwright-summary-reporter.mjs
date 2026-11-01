/**
 * @file Custom Playwright reporter that writes a static Markdown summary (`playwright-report/summary.md`).
 *
 * Designed so that `pnpm e2etest` and `pnpm e2etest:report` produce static, self-contained
 * report files (`index.html`, `results.json`, `summary.md`) and exit immediately without
 * leaving any background HTTP server running.
 */
import fs from "node:fs";
import path from "node:path";

// biome-ignore lint/suspicious/noControlCharactersInRegex: strip ANSI escape codes from error output
const ANSI_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

/**
 * Strips ANSI color sequences from Playwright error messages.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripAnsi(text) {
  return text.replace(ANSI_ESCAPE_PATTERN, "");
}

/**
 * Formats a test outcome status into a concise label.
 *
 * @param {string} status
 * @returns {string}
 */
function formatStatusBadge(status) {
  switch (status) {
    case "passed":
      return "PASS";
    case "failed":
      return "FAIL";
    case "timedOut":
      return "TIMEOUT";
    case "skipped":
      return "SKIP";
    default:
      return status.toUpperCase();
  }
}

/**
 * Escapes pipe characters and newlines for Markdown table cells.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeTableCell(value) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

export default class PlaywrightSummaryReporter {
  /**
   * @param {{ outputFile?: string; printSummary?: boolean }} [options]
   */
  constructor(options = {}) {
    this.outputFile = options.outputFile ?? "playwright-report/summary.md";
    this.printSummary = Boolean(options.printSummary);
    /** @type {Array<{ file: string; suite: string; title: string; status: string; durationMs: number; error?: string }>} */
    this.entries = [];
    this.rootDir = process.cwd();
    this.startedAt = Date.now();
  }

  /**
   * @param {import("@playwright/test/reporter").FullConfig} config
   */
  onBegin(config) {
    this.rootDir = config.rootDir || process.cwd();
    this.startedAt = Date.now();
    this.entries = [];
  }

  /**
   * @param {import("@playwright/test/reporter").TestCase} test
   * @param {import("@playwright/test/reporter").TestResult} result
   */
  onTestEnd(test, result) {
    // Only record the final retry attempt (or passed/skipped attempt)
    const willRetry =
      result.status !== "passed" && result.status !== "skipped" && result.retry < test.retries;
    if (willRetry) {
      return;
    }

    const relativeFile = path.relative(this.rootDir, test.location.file).replace(/\\/g, "/");
    const titlePath = test.titlePath().filter(Boolean);
    // titlePath typically: [projectName?, relativeFile, ...describeTitles, testTitle]
    const describeTitles = titlePath.slice(1, -1).filter((part) => part !== relativeFile);
    const suite = describeTitles.join(" > ");

    const rawError = result.errors?.[0]?.message ?? result.error?.message;

    this.entries.push({
      file: relativeFile,
      suite,
      title: test.title,
      status: result.status,
      durationMs: result.duration,
      error: rawError ? stripAnsi(rawError).trim() : undefined,
    });
  }

  /**
   * @param {import("@playwright/test/reporter").FullResult} result
   */
  onEnd(result) {
    const totalDurationSec = ((result.duration ?? Date.now() - this.startedAt) / 1000).toFixed(2);
    const passedCount = this.entries.filter((e) => e.status === "passed").length;
    const failedCount = this.entries.filter(
      (e) => e.status === "failed" || e.status === "timedOut",
    ).length;
    const skippedCount = this.entries.filter((e) => e.status === "skipped").length;

    const reportAbsPath = path.resolve(process.cwd(), this.outputFile);
    const reportDir = path.dirname(reportAbsPath);
    fs.mkdirSync(reportDir, { recursive: true });

    const htmlReportPath = path.join(reportDir, "index.html");
    const jsonReportPath = path.join(reportDir, "results.json");

    const lines = [
      "# Playwright E2E Test Report",
      "",
      `- **Overall Status**: ${result.status.toUpperCase()}`,
      `- **Summary**: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped (${this.entries.length} total)`,
      `- **Duration**: ${totalDurationSec}s`,
      `- **Generated At**: ${new Date().toISOString()}`,
      "",
      "## Output Artifacts",
      "",
      `- HTML Report (Browser): \`${path.relative(process.cwd(), htmlReportPath)}\``,
      `- JSON Report (Machine-readable): \`${path.relative(process.cwd(), jsonReportPath)}\``,
      `- Markdown Summary: \`${path.relative(process.cwd(), reportAbsPath)}\``,
      "",
      "## Scenarios",
      "",
      "| Status | File | Scenario | Duration |",
      "| :--- | :--- | :--- | ---: |",
    ];

    for (const entry of this.entries) {
      const scenarioLabel = entry.suite ? `${entry.suite} › ${entry.title}` : entry.title;
      lines.push(
        `| ${formatStatusBadge(entry.status)} | \`${escapeTableCell(entry.file)}\` | ${escapeTableCell(scenarioLabel)} | ${(entry.durationMs / 1000).toFixed(2)}s |`,
      );
    }

    const failedEntries = this.entries.filter((e) => e.error);
    if (failedEntries.length > 0) {
      lines.push("", "## Failure Details", "");
      for (const entry of failedEntries) {
        lines.push(
          `### ${entry.file} — ${entry.title}`,
          "",
          "```text",
          entry.error ?? "",
          "```",
          "",
        );
      }
    }

    lines.push("");
    const markdown = lines.join("\n");
    fs.writeFileSync(reportAbsPath, markdown, "utf8");

    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8");
    }

    if (this.printSummary) {
      process.stdout.write(
        `\n[Playwright Report Generated]\n` +
          `  HTML     : ${htmlReportPath}\n` +
          `  Markdown : ${reportAbsPath}\n` +
          `  JSON     : ${jsonReportPath}\n`,
      );
    }
  }
}
