/**
 * @file EPUB builder using html-to-epub.
 */
import { EPub } from "@lesjoursfr/html-to-epub";
import path from "node:path";
import type { EpubChapter, EpubInput } from "@/lib/epub/types";
import { loadLayoutTemplate, renderChapterHtml } from "@/lib/epub/template-renderer";
import { downloadMedia } from "@/lib/epub/media-downloader";
import { renderCoverJpg } from "@/lib/epub/cover-renderer";

/**
 * Builds an EPUB file from Instagram media items.
 */
export async function buildEpub(
  input: EpubInput,
  outputDir: string
): Promise<string> {
  const template = await loadLayoutTemplate();
  const chapterData: EpubChapter[] = [];

  for (const item of input.items) {
    const imagePath = await downloadMedia(item, outputDir);
    const html = renderChapterHtml(template, item, `file://${imagePath}`);
    chapterData.push({
      title: item.caption?.slice(0, 32) || "Instagram Post",
      data: html,
      filename: `${item.id}.xhtml`,
    });
  }

  const coverPath = await renderCoverJpg(input.metadata, outputDir);
  const outputPath = path.join(outputDir, "instagram-feed.epub");

  const epub = new EPub(
    {
      title: input.metadata.title,
      author: input.metadata.author,
      publisher: input.metadata.contact,
      cover: coverPath,
      lang: input.metadata.language ?? "ja",
      appendChapterTitles: false,
      content: chapterData,
    },
    outputPath
  );

  await epub.render();
  return outputPath;
}
