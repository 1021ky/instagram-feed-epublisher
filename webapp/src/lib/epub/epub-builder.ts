/**
 * @file EPUB builder using html-to-epub.
 */
import { EPub } from "@lesjoursfr/html-to-epub";
import path from "node:path";
import { getLogger } from "@/lib/logger";

const logger = getLogger("epub.builder");
import type { EpubChapter, EpubInput } from "@/lib/epub/types";
import { loadLayoutTemplate, renderChapterHtml } from "@/lib/epub/template-renderer";
import { downloadMedia } from "@/lib/epub/media-downloader";
import { renderCoverJpg } from "@/lib/epub/cover-renderer";

function getTemplatesDir(): string {
  return path.resolve(process.cwd(), "node_modules", "@lesjoursfr", "html-to-epub", "templates");
}

/**
 * Builds an EPUB file from Instagram media items.
 */
export async function buildEpub(input: EpubInput, outputDir: string): Promise<string> {
  logger.info("Building EPUB", { itemCount: input.items.length, outputDir });

  const template = await loadLayoutTemplate();
  const chapterData: EpubChapter[] = [];

  logger.debug("Downloading media for chapters", { itemCount: input.items.length });
  for (const item of input.items) {
    const imagePath = await downloadMedia(item, outputDir);
    const html = renderChapterHtml(template, item, `file://${imagePath}`);
    chapterData.push({
      title: item.caption?.slice(0, 32) || "Instagram Post",
      data: html,
      filename: `${item.id}.xhtml`,
    });
  }
  logger.info("Media download completed", { chapterCount: chapterData.length });

  logger.debug("Generating cover image");
  const coverPath = await renderCoverJpg(input.metadata, outputDir);
  logger.info("Cover generated", { coverPath });

  const outputPath = path.join(outputDir, "instagram-feed.epub");

  const templatesDir = getTemplatesDir();
  logger.debug("Rendering EPUB file", { outputPath, templatesDir });
  const epub = new EPub(
    {
      title: input.metadata.title,
      author: input.metadata.author,
      publisher: input.metadata.contact,
      cover: coverPath,
      lang: input.metadata.language ?? "ja",
      appendChapterTitles: false,
      content: chapterData,
      css: template.cssContent,
      customOpfTemplatePath: path.join(templatesDir, "epub3", "content.opf.ejs"),
      customNcxTocTemplatePath: path.join(templatesDir, "toc.ncx.ejs"),
      customHtmlTocTemplatePath: path.join(templatesDir, "epub3", "toc.xhtml.ejs"),
    },
    outputPath
  );

  await epub.render();
  logger.info("EPUB rendered successfully", { outputPath });
  return outputPath;
}
