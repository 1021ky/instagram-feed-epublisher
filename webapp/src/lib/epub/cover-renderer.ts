/**
 * @file Cover renderer using Playwright to generate JPG.
 */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveCoverTheme } from "@/lib/epub/themes";
import type { CoverThemeId, EpubMetadata } from "@/lib/epub/types";

/**
 * Renders a cover image (JPG) from HTML.
 */
export async function renderCoverJpg(
  metadata: EpubMetadata,
  outputDir: string,
  themeId?: CoverThemeId,
): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
    const html = buildCoverHtml(metadata, themeId);

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
export function buildCoverHtml(metadata: EpubMetadata, themeId?: CoverThemeId): string {
  const title = metadata.title || "Instagram Feed";
  const author = metadata.author || "";
  const instagramUrl = metadata.instagramUrl || "";
  const theme = resolveCoverTheme(themeId);

  return `
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            font-family: ${theme.bodyFontFamily};
            background: ${theme.backgroundColor};
            color: ${theme.textColor};
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .card {
            background: ${theme.panelBackground};
            border-radius: 24px;
            padding: 80px;
            width: 920px;
            box-shadow: 0 40px 80px rgba(15, 23, 42, 0.25);
            border-top: 12px solid ${theme.accentColor};
          }
          h1 {
            margin: 0 0 24px;
            font-size: 56px;
            line-height: 1.1;
            font-family: ${theme.titleFontFamily};
            letter-spacing: ${theme.titleLetterSpacing};
          }
          .meta {
            font-size: 22px;
            color: ${theme.mutedTextColor};
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
