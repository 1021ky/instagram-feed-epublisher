/**
 * @file Playwright を使って JPG 表紙を生成するレンダラー
 */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getCoverTheme } from "@/lib/epub/themes";
import type { EpubMetadata } from "@/lib/epub/types";

/**
 * HTML から表紙画像（JPG）を生成する。
 */
export async function renderCoverJpg(metadata: EpubMetadata, outputDir: string): Promise<string> {
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
 * 表紙用の HTML マークアップを組み立てる。
 */
export function buildCoverHtml(metadata: EpubMetadata): string {
  const title = metadata.title || "Instagram Feed";
  const subtitle = metadata.subtitle || "";
  const author = metadata.author || "";
  const instagramUrl = metadata.instagramUrl || "";
  const theme = getCoverTheme(metadata.coverTheme ?? "navy");

  return `
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            font-family: "Inter", "Helvetica", "Arial", sans-serif;
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
            box-shadow: 0 40px 80px rgba(15, 23, 42, 0.4);
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
 * HTML エンティティをエスケープする。
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
