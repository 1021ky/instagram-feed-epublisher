/**
 * @file 表紙レンダラーの単体テスト。
 */
import { expect, test, vi } from "vitest";

vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn(),
        screenshot: vi.fn().mockResolvedValue(Buffer.from("jpg")),
      }),
      close: vi.fn(),
    }),
  },
}));

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

import { buildCoverHtml, escapeHtml, renderCoverJpg } from "./cover-renderer";

test("buildCoverHtmlはメタデータを含む", () => {
  const html = buildCoverHtml({
    title: "Title",
    author: "Author",
    contact: "",
    instagramUrl: "https://instagram.com",
  });
  expect(html).toContain("Title");
  expect(html).toContain("Author");
});

test("buildCoverHtmlは選択テーマの配色とタイポグラフィを反映する", () => {
  const html = buildCoverHtml(
    {
      title: "Title",
      author: "Author",
      contact: "",
      instagramUrl: "https://instagram.com",
    },
    "purple",
  );

  expect(html).toContain("#2e1065");
  expect(html).toContain("#f9a8d4");
  expect(html).toContain('"Trebuchet MS", "Helvetica", "Arial", sans-serif');
});

test("escapeHtmlは危険な文字をエスケープする", () => {
  expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
});

test("renderCoverJpgは表紙画像のパスを返す", async () => {
  const path = await renderCoverJpg(
    { title: "t", author: "a", contact: "", instagramUrl: "" },
    "/tmp",
  );
  expect(path).toBe("/tmp/cover.jpg");
});

test("renderCoverJpgはPlaywright失敗時に例外を投げる", async () => {
  const { chromium } = await import("playwright");
  (chromium.launch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
    new Error("launch error"),
  );

  await expect(
    renderCoverJpg({ title: "t", author: "a", contact: "", instagramUrl: "" }, "/tmp"),
  ).rejects.toThrow("launch error");
});
