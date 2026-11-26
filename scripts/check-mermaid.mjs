#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const webappDir = join(repoRoot, "webapp");

// Candidate browser executable paths (Linux CI, macOS, custom env)
const candidatePaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const executablePath = candidatePaths.find((p) => p && existsSync(p));

// Puppeteer config with sandbox args for CI/Docker compatibility
const tempConfigDir = join(tmpdir(), `mermaid-check-${Date.now()}`);
mkdirSync(tempConfigDir, { recursive: true });
const puppeteerConfigPath = join(tempConfigDir, "puppeteer-config.json");
writeFileSync(
  puppeteerConfigPath,
  JSON.stringify({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(executablePath ? { executablePath } : {}),
  }),
);

try {
  let targetFiles = process.argv.slice(2);

  if (targetFiles.length === 0) {
    const designdocDir = join(repoRoot, "docs/designdoc");
    if (existsSync(designdocDir)) {
      targetFiles = readdirSync(designdocDir)
        .filter((f) => f.endsWith(".mmd"))
        .map((f) => join(designdocDir, f));
    }
  }

  if (targetFiles.length === 0) {
    console.log("No .mmd files found to check.");
    process.exit(0);
  }

  console.log(`Checking ${targetFiles.length} Mermaid diagram(s)...`);

  for (const file of targetFiles) {
    const absPath = resolve(process.cwd(), file);
    const outPath = join(tempConfigDir, "temp-output.svg");
    console.log(`  Validating: ${file}`);
    execFileSync(
      "pnpm",
      ["--dir", webappDir, "exec", "mmdc", "-p", puppeteerConfigPath, "-i", absPath, "-o", outPath],
      {
        cwd: repoRoot,
        stdio: "inherit",
      },
    );
  }

  console.log("✅ All Mermaid diagram(s) passed validation.");
} finally {
  try {
    rmSync(tempConfigDir, { recursive: true, force: true });
  } catch {}
}
