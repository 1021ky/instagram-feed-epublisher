/**
 * @file html-to-epubを利用したEPUBビルダー。
 */
import { EPub } from "@lesjoursfr/html-to-epub";
import { existsSync } from "node:fs";
import path from "node:path";
import { getLogger } from "@/lib/logger";
import type { InstagramMedia } from "@/lib/instagram/types";
import { DEFAULT_COVER_THEME_ID } from "@/lib/epub/themes";

const logger = getLogger("epub.builder");
import type { EpubChapter, EpubInput } from "@/lib/epub/types";
import { loadLayoutTemplate, renderChapterHtml } from "@/lib/epub/template-renderer";
import { downloadMedia } from "@/lib/epub/media-downloader";
import { renderCoverJpg } from "@/lib/epub/cover-renderer";
import { sortItemsByTimestamp } from "@/lib/epub/sort";
import { resolveMediaImagesForEpub } from "@/lib/instagram/media-resolver";

function getTemplatesDir(): string {
  const candidates = [
    path.resolve(
      process.cwd(),
      "webapp",
      "node_modules",
      "@lesjoursfr",
      "html-to-epub",
      "templates",
    ),
    path.resolve(process.cwd(), "node_modules", "@lesjoursfr", "html-to-epub", "templates"),
    path.resolve(process.cwd(), "templates"),
  ];
  for (const candidate of candidates) {
    if (existsSync(/*turbopackIgnore: true*/ candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

/**
 * Instagramメディア項目からEPUBファイルを生成します。
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
    if (item.media_type === "CAROUSEL_ALBUM") {
      const selectedChildIds = input.selectedCarouselChildren?.[item.id];
      const resolvedImages = resolveMediaImagesForEpub(item, selectedChildIds);

      if (
        resolvedImages.length === 0 &&
        selectedChildIds !== undefined &&
        selectedChildIds.length === 0
      ) {
        logger.warn("カルーセル投稿で選択された画像が0枚のためスキップします", {
          itemId: item.id,
        });
        continue;
      }

      if (resolvedImages.length > 0) {
        const totalPages = resolvedImages.length;
        const baseTitle = item.caption?.slice(0, 32) || "Instagram Post";

        for (const [pageIndex, entry] of resolvedImages.entries()) {
          const downloadItem: InstagramMedia = {
            ...item,
            id: totalPages > 1 ? `${item.id}_${pageIndex + 1}` : item.id,
            media_type: "IMAGE",
            media_url: entry.url,
          };
          const imagePath = await downloadMedia(downloadItem, outputDir);
          const html = renderChapterHtml(template, item, `file://${imagePath}`, {
            pageIndex,
            totalPages,
          });
          chapterData.push({
            title: totalPages > 1 ? `${baseTitle} (${pageIndex + 1}/${totalPages})` : baseTitle,
            data: html,
            filename: totalPages > 1 ? `${item.id}_${pageIndex + 1}.xhtml` : `${item.id}.xhtml`,
          });
        }
        continue;
      }
    }

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
    input.coverTheme ?? input.metadata.coverTheme ?? DEFAULT_COVER_THEME_ID,
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
      customHtmlCoverTemplatePath: path.join(templatesDir, "epub3", "cover.xhtml.ejs"),
      useSelfClosingTags: true,
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
  const filtered = items.filter((item) => (selectedIds ? selectedIds.has(item.id) : true));

  const invalidTimestampCount = filtered.filter((item) =>
    Number.isNaN(Date.parse(item.timestamp)),
  ).length;
  if (invalidTimestampCount > 0) {
    logger.debug("一部のEPUB項目で不正なtimestampを検出したため元の順序を維持します", {
      invalidTimestampCount,
    });
  }

  return sortItemsByTimestamp(filtered, sortOrder);
}
