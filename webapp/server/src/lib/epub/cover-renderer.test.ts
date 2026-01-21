/**
 * @file Unit tests for cover renderer.
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
  const actual = await vi.importActual<typeof import("node:fs/promises")>(
    "node:fs/promises"
  );
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

import { buildCoverHtml, escapeHtml, renderCoverJpg } from "./cover-renderer";

test("buildCoverHtml includes metadata", () => {
  const html = buildCoverHtml({
    title: "Title",
    author: "Author",
    contact: "",
    instagramUrl: "https://instagram.com",
  });
  expect(html).toContain("Title");
  expect(html).toContain("Author");
});

test("escapeHtml escapes unsafe characters", () => {
  expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
});

test("renderCoverJpg returns cover path", async () => {
  const path = await renderCoverJpg(
    { title: "t", author: "a", contact: "", instagramUrl: "" },
    "/tmp"
  );
  expect(path).toBe("/tmp/cover.jpg");
});

test("renderCoverJpg throws when Playwright fails", async () => {
  const { chromium } = await import("playwright");
  (chromium.launch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
    new Error("launch error")
  );

  await expect(
    renderCoverJpg({ title: "t", author: "a", contact: "", instagramUrl: "" }, "/tmp")
  ).rejects.toThrow("launch error");
});
