/**
 * @file Media downloader for EPUB assets.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveMediaDisplayUrl } from "@/lib/instagram/media-resolver";
import type { InstagramMedia } from "@/lib/instagram/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger("epub.media-downloader");

/**
 * Downloads an Instagram media item to local storage.
 */
export async function downloadMedia(item: InstagramMedia, outputDir: string): Promise<string> {
  const url = resolveMediaDisplayUrl(item);
  if (!url) {
    logger.error("Media image URL not found", {
      itemId: item.id,
      mediaType: item.media_type,
    });
    throw new Error(`画像のURLが見つかりません: ${item.id}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    logger.error("Media image fetch failed", {
      itemId: item.id,
      status: response.status,
    });
    throw new Error(`画像の取得に失敗しました: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `${item.id}.jpg`;
  const filePath = path.join(outputDir, filename);
  await writeFile(filePath, buffer);
  return filePath;
}
