/**
 * @file Satoriとsharpを使ってJPG表紙を高速・軽量に生成する表紙レンダラー。
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import React from "react";
import satori from "satori";
import sharp from "sharp";
import { resolveCoverTheme } from "@/lib/epub/themes";
import type { CoverThemeId, EpubMetadata } from "@/lib/epub/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger("epub.cover-renderer");

export interface LoadedFonts {
  bold: ArrayBuffer;
  regular: ArrayBuffer;
}

let fontCache: LoadedFonts | null = null;

/**
 * フォントファイルの配置パスを解決します。
 */
export function resolveFontPath(fontFileName: string): string {
  const candidates = [
    path.resolve(process.cwd(), "webapp", "public", "fonts", fontFileName),
    path.resolve(process.cwd(), "public", "fonts", fontFileName),
  ];
  for (const candidate of candidates) {
    if (existsSync(/*turbopackIgnore: true*/ candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

/**
 * 表紙生成に必要なフォントバイナリをロードします（インメモリキャッシュ対応）。
 */
export async function loadFonts(): Promise<LoadedFonts> {
  if (fontCache) {
    return fontCache;
  }

  const boldPath = resolveFontPath("NotoSansJP-Bold.ttf");
  const regularPath = resolveFontPath("NotoSansJP-Regular.ttf");

  logger.debug("Loading font files", { boldPath, regularPath });

  const [boldBuffer, regularBuffer] = await Promise.all([
    readFile(/*turbopackIgnore: true*/ boldPath),
    readFile(/*turbopackIgnore: true*/ regularPath),
  ]);

  fontCache = {
    bold: boldBuffer.buffer.slice(
      boldBuffer.byteOffset,
      boldBuffer.byteOffset + boldBuffer.byteLength,
    ),
    regular: regularBuffer.buffer.slice(
      regularBuffer.byteOffset,
      regularBuffer.byteOffset + regularBuffer.byteLength,
    ),
  };

  logger.info("Fonts loaded and cached in memory");
  return fontCache;
}

/**
 * テスト用: フォントキャッシュを更新またはリセットします。
 */
export function setFontCache(fonts: LoadedFonts | null): void {
  fontCache = fonts;
}

/**
 * 表紙用のReact要素（JSX）を組み立てます。
 */
export function buildCoverElement(
  metadata: EpubMetadata,
  themeId?: CoverThemeId,
): React.ReactElement {
  const title = metadata.title || "Instagram Feed";
  const subtitle = metadata.subtitle || "";
  const author = metadata.author || "";
  const instagramUrl = metadata.instagramUrl || "";
  const theme = resolveCoverTheme(themeId ?? metadata.coverTheme);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "1200px",
        height: "1600px",
        backgroundColor: theme.pageBackground,
        fontFamily: "Noto Sans JP",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "920px",
          backgroundImage: theme.cardBackground,
          borderRadius: "24px",
          padding: "80px",
          boxShadow: "0 40px 80px rgba(15, 23, 42, 0.25)",
          borderTop: `12px solid ${theme.accentColor}`,
        }}
      >
        <div
          style={{
            width: "120px",
            height: "10px",
            borderRadius: "999px",
            backgroundColor: theme.accentColor,
            marginBottom: "40px",
          }}
        />
        <h1
          style={{
            margin: "0 0 24px 0",
            fontSize: "56px",
            lineHeight: 1.1,
            fontWeight: 700,
            color: theme.textColor,
            letterSpacing: theme.titleLetterSpacing ?? "0.02em",
            wordBreak: "break-word",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              margin: "0 0 36px 0",
              fontSize: "28px",
              lineHeight: 1.4,
              color: theme.metaColor,
              fontWeight: 400,
              wordBreak: "break-word",
            }}
          >
            {subtitle}
          </p>
        ) : null}
        {author ? (
          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: "22px",
              color: theme.metaColor,
              fontWeight: 400,
              wordBreak: "break-word",
            }}
          >
            {author}
          </p>
        ) : null}
        {instagramUrl ? (
          <p
            style={{
              margin: "0",
              fontSize: "22px",
              color: theme.metaColor,
              fontWeight: 400,
              wordBreak: "break-word",
            }}
          >
            {instagramUrl}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Satoriを使って表紙のSVG文字列を生成します。
 */
export async function renderCoverSvg(
  metadata: EpubMetadata,
  themeId?: CoverThemeId,
): Promise<string> {
  const fonts = await loadFonts();
  const element = buildCoverElement(metadata, themeId);

  return await satori(element, {
    width: 1200,
    height: 1600,
    fonts: [
      {
        name: "Noto Sans JP",
        data: fonts.bold,
        weight: 700,
        style: "normal",
      },
      {
        name: "Noto Sans JP",
        data: fonts.regular,
        weight: 400,
        style: "normal",
      },
    ],
  });
}

/**
 * Satoriとsharpを使って表紙画像（JPG）を生成します。
 */
export async function renderCoverJpg(
  metadata: EpubMetadata,
  outputDir: string,
  themeId?: CoverThemeId,
): Promise<string> {
  const coverPath = path.join(outputDir, "cover.jpg");

  if (metadata.coverImageUrl) {
    const normalizedCoverUrl = metadata.coverImageUrl.trim();
    if (!normalizedCoverUrl.startsWith("data:image/")) {
      throw new Error("表紙画像は画像アップロードのdata URLのみ指定できます");
    }
    logger.debug("Rendering custom cover image", {
      coverImageUrlLength: normalizedCoverUrl.length,
      mimeType: normalizedCoverUrl.slice(0, 32),
    });
    const base64Data = normalizedCoverUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    await writeFile(coverPath, imageBuffer);
    logger.info("Custom cover image written successfully", { coverPath, size: imageBuffer.length });
    return coverPath;
  }

  logger.debug("Rendering cover SVG with Satori", { title: metadata.title, themeId });
  const svg = await renderCoverSvg(metadata, themeId);

  logger.debug("Rasterizing cover SVG to JPEG with sharp");
  const jpegBuffer = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();

  await writeFile(coverPath, jpegBuffer);
  logger.info("Cover JPEG written successfully", { coverPath, size: jpegBuffer.length });
  return coverPath;
}
