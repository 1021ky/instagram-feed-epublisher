/**
 * @file Cover renderer using Playwright to generate JPG.
 */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { EpubMetadata } from "@/lib/epub/types";

const coverThemeStyles: Record<
  NonNullable<EpubMetadata["coverTheme"]>,
  {
    pageBackground: string;
    cardBackground: string;
    textColor: string;
    metaColor: string;
    accentColor: string;
  }
> = {
  navy: {
    pageBackground: "#0f172a",
    cardBackground: "linear-gradient(160deg, #1e3a8a, #0f172a)",
    textColor: "#f8fafc",
    metaColor: "#cbd5f5",
    accentColor: "#f59e0b",
  },
  slate: {
    pageBackground: "#111827",
    cardBackground: "linear-gradient(160deg, #334155, #111827)",
    textColor: "#f8fafc",
    metaColor: "#cbd5e1",
    accentColor: "#38bdf8",
  },
  ivory: {
    pageBackground: "#f5efe2",
    cardBackground: "linear-gradient(160deg, #fffaf0, #efe5d0)",
    textColor: "#3f2d1d",
    metaColor: "#7c5a3c",
    accentColor: "#c2410c",
  },
  white: {
    pageBackground: "#f8fafc",
    cardBackground: "linear-gradient(160deg, #ffffff, #eef2f7)",
    textColor: "#0f172a",
    metaColor: "#475569",
    accentColor: "#0f172a",
  },
  purple: {
    pageBackground: "#1e1b4b",
    cardBackground: "linear-gradient(160deg, #581c87, #1e1b4b)",
    textColor: "#f5f3ff",
    metaColor: "#ddd6fe",
    accentColor: "#c4b5fd",
  },
};

/**
 * Renders a cover image (JPG) from HTML.
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
 * Builds HTML markup for the cover.
 */
export function buildCoverHtml(metadata: EpubMetadata): string {
  const title = metadata.title || "Instagram Feed";
  const subtitle = metadata.subtitle || "";
  const author = metadata.author || "";
  const instagramUrl = metadata.instagramUrl || "";
  const theme = coverThemeStyles[metadata.coverTheme ?? "navy"];

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
