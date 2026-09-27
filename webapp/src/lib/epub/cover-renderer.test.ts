import path from "node:path";
import { expect, test } from "vitest";

import {
  buildCoverElement,
  escapeHtml,
  loadFonts,
  renderCoverJpg,
  renderCoverSvg,
  resolveFontPath,
} from "./cover-renderer";

test("resolveFontPathはフォントのパスを解決する", () => {
  const fontPath = resolveFontPath("NotoSansJP-Bold.ttf");
  expect(fontPath).toContain("NotoSansJP-Bold.ttf");
});

test("loadFontsはNoto Sans JPフォントのArrayBufferを返す", async () => {
  const fonts = await loadFonts();
  expect(fonts.bold.byteLength).toBeGreaterThan(0);
  expect(fonts.regular.byteLength).toBeGreaterThan(0);
});

test("buildCoverElementはメタデータとテーマスタイルを含むReact要素を生成する", () => {
  const element = buildCoverElement({
    title: "Title",
    subtitle: "Subtitle",
    author: "Author",
    contact: "",
    instagramUrl: "https://instagram.com",
    coverTheme: "ivory",
  });

  expect(element.type).toBe("div");
  const rootProps = element.props as { style: { backgroundColor: string } };
  expect(rootProps.style.backgroundColor).toBe("#f5efe2");
});

test("buildCoverElementは選択テーマの配色を反映する", () => {
  const element = buildCoverElement(
    {
      title: "Title",
      author: "Author",
      contact: "",
      instagramUrl: "https://instagram.com",
    },
    "purple",
  );

  const rootProps = element.props as { style: { backgroundColor: string } };
  expect(rootProps.style.backgroundColor).toBe("#1e1b4b");
});

test("renderCoverSvgはSatoriを用いて1200x1600のSVG文字列を生成する", async () => {
  const svg = await renderCoverSvg(
    {
      title: "テスト書籍",
      subtitle: "サブタイトル",
      author: "著者名",
      contact: "",
      instagramUrl: "https://instagram.com/test",
      coverTheme: "navy",
    },
    "navy",
  );

  expect(svg).toContain("<svg");
  expect(svg).toContain('width="1200"');
  expect(svg).toContain('height="1600"');
});

test("escapeHtmlは危険な文字をエスケープする", () => {
  expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
});

test("renderCoverJpgは表紙画像のパスを返しJPGファイルを生成する", async () => {
  const os = await import("node:os");
  const fsPromises = await import("node:fs/promises");
  const fs = await import("node:fs");
  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "cover-test-"));

  try {
    const coverPath = await renderCoverJpg(
      {
        title: "Test Book",
        subtitle: "Subtitle",
        author: "Author",
        contact: "",
        instagramUrl: "https://instagram.com",
        coverTheme: "white",
      },
      tempDir,
    );
    expect(coverPath).toBe(path.join(tempDir, "cover.jpg"));
    expect(fs.existsSync(coverPath)).toBe(true);
    const stats = fs.statSync(coverPath);
    expect(stats.size).toBeGreaterThan(1000);
  } finally {
    await fsPromises.rm(tempDir, { recursive: true, force: true });
  }
});
