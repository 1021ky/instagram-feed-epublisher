/**
 * @file Cover renderer using Playwright to generate JPG.
 */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { EpubMetadata } from "@/lib/epub/types";

/**
 * Renders a cover image (JPG) from HTML.
 */
export async function renderCoverJpg(
  metadata: EpubMetadata,
  outputDir: string
): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
    const html = buildCoverHtml(metadata);

    await page.setContent(html, { waitUntil: "networkidle" });
    const buffer = await page.screenshot({ type: "jpeg", quality: 90 });

    const coverPath = path.join(outputDir, "cover.jpg");
    await writeFile(coverPath, buffer);
    return coverPath;
  } finally {
    await browser.close();
  }
}

/**
 * Builds HTML markup for the cover.
 */
export function buildCoverHtml(metadata: EpubMetadata): string {
  const title = metadata.title || "Instagram Feed";
  const author = metadata.author || "";
  const instagramUrl = metadata.instagramUrl || "";

  return `
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            font-family: "Inter", "Helvetica", "Arial", sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .card {
            background: linear-gradient(160deg, #1e3a8a, #0f172a);
            border-radius: 24px;
            padding: 80px;
            width: 920px;
            box-shadow: 0 40px 80px rgba(15, 23, 42, 0.4);
          }
          h1 {
            margin: 0 0 24px;
            font-size: 56px;
            line-height: 1.1;
          }
          .meta {
            font-size: 22px;
            color: #cbd5f5;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${escapeHtml(title)}</h1>
          <p class="meta">${escapeHtml(author)}</p>
          <p class="meta">${escapeHtml(instagramUrl)}</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Escapes HTML entities.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
