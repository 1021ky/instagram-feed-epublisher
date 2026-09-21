/**
 * @file EPUB builder using html-to-epub.
 */
import { EPub } from "@lesjoursfr/html-to-epub";
import path from "node:path";
import { getLogger } from "@/lib/logger";
import type { InstagramMedia } from "@/lib/instagram/types";
import { DEFAULT_COVER_THEME_ID } from "@/lib/epub/themes";

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
  const preparedItems = prepareItems(input.items, input.selectedMediaIds, input.sortOrder);

  logger.info("Building EPUB", {
    itemCount: preparedItems.length,
    outputDir,
    sortOrder: input.sortOrder ?? "desc",
    hasSelection: Boolean(input.selectedMediaIds?.length),
  });

  const template = await loadLayoutTemplate();
  const chapterData: EpubChapter[] = [];

  logger.debug("Downloading media for chapters", { itemCount: preparedItems.length });
  for (const item of preparedItems) {
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
  const coverPath = await renderCoverJpg(
    input.metadata,
    outputDir,
    input.coverTheme ?? DEFAULT_COVER_THEME_ID,
  );
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
    outputPath,
  );

  await epub.render();
  logger.info("EPUB rendered successfully", { outputPath });
  return outputPath;
}

function prepareItems(
  items: InstagramMedia[],
  selectedMediaIds?: string[],
  sortOrder: EpubInput["sortOrder"] = "desc",
): InstagramMedia[] {
  const selectedIds = selectedMediaIds?.length ? new Set(selectedMediaIds) : null;
  const preparedEntries = items
    .map((item, index) => ({
      item,
      index,
      timestamp: Date.parse(item.timestamp),
    }))
    .filter(({ item }) => (selectedIds ? selectedIds.has(item.id) : true));

  const invalidTimestampCount = preparedEntries.filter(({ timestamp }) =>
    Number.isNaN(timestamp),
  ).length;
  if (invalidTimestampCount > 0) {
    logger.debug("Some EPUB items had invalid timestamps; preserving input order for those items", {
      invalidTimestampCount,
    });
  }

  return preparedEntries
    .sort((left, right) => {
      const leftValid = !Number.isNaN(left.timestamp);
      const rightValid = !Number.isNaN(right.timestamp);

      if (!leftValid && !rightValid) {
        return left.index - right.index;
      }

      if (!leftValid) {
        return 1;
      }

      if (!rightValid) {
        return -1;
      }

      const delta = left.timestamp - right.timestamp;
      return sortOrder === "asc" ? delta : -delta;
    })
    .map(({ item }) => item);
}
