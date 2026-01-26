/**
 * @file Unit tests for EPUB template renderer.
 */
import { expect, test, vi } from "vitest";

const realModulePath = "./template-renderer";

test("renderChapterHtml replaces placeholders", async () => {
  const { renderChapterHtml } = await import(realModulePath);
  const html = renderChapterHtml(
    { layoutHtml: "{chapter_title}-{image_filename}-{caption_html}-{post_url}", cssContent: "" },
    {
      id: "1",
      caption: "Hello",
      media_url: "x",
      permalink: "p",
      timestamp: "t",
    },
    "file:///tmp/a.jpg"
  );
  expect(html).toContain("Hello");
  expect(html).toContain("file:///tmp/a.jpg");
});

test("loadLayoutTemplate throws on read failure", async () => {
  vi.resetModules();
  vi.mock("node:fs/promises", () => ({
    readFile: vi.fn().mockRejectedValue(new Error("read error")),
  }));
  const { loadLayoutTemplate } = await import(realModulePath);
  await expect(loadLayoutTemplate()).rejects.toThrow("read error");
});
