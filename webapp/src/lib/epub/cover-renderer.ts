/**
 * @file Playwrightを使ってJPG表紙を生成する表紙レンダラー。
 */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveCoverTheme } from "@/lib/epub/themes";
import type { CoverThemeId, EpubMetadata } from "@/lib/epub/types";

/**
 * HTMLから表紙画像（JPG）を生成します。
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
 * 表紙用のHTMLマークアップを組み立てます。
 */
export function buildCoverHtml(metadata: EpubMetadata, themeId?: CoverThemeId): string {
  const title = metadata.title || "Instagram Feed";
  const subtitle = metadata.subtitle || "";
  const author = metadata.author || "";
  const instagramUrl = metadata.instagramUrl || "";
  const theme = resolveCoverTheme(themeId ?? metadata.coverTheme);

  return `
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            font-family: ${theme.bodyFontFamily ?? '"Inter", "Helvetica", "Arial", sans-serif'};
            background: ${theme.pageBackground};
            color: ${theme.textColor};
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .card {
            background: ${theme.cardBackground};
            border-radius: 24px;
            padding: 80px;
            width: 920px;
            box-shadow: 0 40px 80px rgba(15, 23, 42, 0.25);
            border-top: 12px solid ${theme.accentColor};
          }
          .accent {
            width: 120px;
            height: 10px;
            border-radius: 999px;
            background: ${theme.accentColor};
            margin-bottom: 40px;
          }
          h1 {
            margin: 0 0 24px;
            font-size: 56px;
            line-height: 1.1;
            font-family: ${theme.titleFontFamily ?? '"Inter", "Helvetica", "Arial", sans-serif'};
            letter-spacing: ${theme.titleLetterSpacing ?? "0.02em"};
          }
          .subtitle {
            margin: 0 0 36px;
            font-size: 28px;
            line-height: 1.4;
            color: ${theme.metaColor};
          }
          .meta {
            font-size: 22px;
            color: ${theme.metaColor};
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="accent"></div>
          <h1>${escapeHtml(title)}</h1>
          ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
          <p class="meta">${escapeHtml(author)}</p>
          <p class="meta">${escapeHtml(instagramUrl)}</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * HTMLエンティティをエスケープします。
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
