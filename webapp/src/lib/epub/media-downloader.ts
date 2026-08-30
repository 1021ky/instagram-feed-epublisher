/**
 * @file Media downloader for EPUB assets.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { InstagramMedia } from "@/lib/instagram/types";

/**
 * Downloads an Instagram media item to local storage.
 */
export async function downloadMedia(item: InstagramMedia, outputDir: string): Promise<string> {
  let url = item.media_url;
  if (item.media_type === "VIDEO") url = item.thumbnail_url;
  if (item.media_type === "CAROUSEL_ALBUM" && item.children?.data?.length) {
    const firstChild = item.children.data[0];
    url = firstChild.media_type === "VIDEO" ? firstChild.thumbnail_url : firstChild.media_url;
  }

  if (!url) {
    throw new Error(`画像のURLが見つかりません: ${item.id}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`画像の取得に失敗しました: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `${item.id}.jpg`;
  const filePath = path.join(outputDir, filename);
  await writeFile(filePath, buffer);
  return filePath;
}
