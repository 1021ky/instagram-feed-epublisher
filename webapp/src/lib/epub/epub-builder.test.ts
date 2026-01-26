/**
 * @file Unit tests for EPUB builder.
 */
import { expect, test, vi } from "vitest";

vi.mock("@lesjoursfr/html-to-epub", () => ({
  EPub: class {
    render(): Promise<void> {
      return Promise.resolve();
    }
  },
}));

vi.mock("@/lib/epub/media-downloader", () => ({
  downloadMedia: vi.fn().mockResolvedValue("/tmp/1.jpg"),
}));

vi.mock("@/lib/epub/template-renderer", () => ({
  loadLayoutTemplate: vi.fn().mockResolvedValue({ layoutHtml: "x", cssContent: "y" }),
  renderChapterHtml: vi.fn().mockReturnValue("<html></html>"),
}));

vi.mock("@/lib/epub/cover-renderer", () => ({
  renderCoverJpg: vi.fn().mockResolvedValue("/tmp/cover.jpg"),
}));

import { buildEpub } from "./epub-builder";

const items = [
  {
    id: "1",
    media_url: "x",
    permalink: "p",
    timestamp: "t",
  },
];

test("buildEpub returns output path", async () => {
  const output = await buildEpub(
    {
      items,
      metadata: {
        title: "title",
        author: "author",
        contact: "contact",
        instagramUrl: "url",
      },
    },
    "/tmp"
  );
  expect(output).toBe("/tmp/instagram-feed.epub");
});

test("buildEpub throws on render error", async () => {
  const { EPub } = await import("@lesjoursfr/html-to-epub");
  const renderMock = vi.fn().mockRejectedValue(new Error("render error"));
  (EPub as unknown as { prototype: { render: typeof renderMock } }).prototype.render =
    renderMock;

  await expect(
    buildEpub(
      {
        items,
        metadata: {
          title: "title",
          author: "author",
          contact: "contact",
          instagramUrl: "url",
        },
      },
      "/tmp"
    )
  ).rejects.toThrow("render error");
});
