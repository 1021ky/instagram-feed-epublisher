/**
 * @file Media downloader for EPUB assets.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { InstagramMedia } from "@/lib/instagram/types";

/**
 * Downloads an Instagram media item to local storage.
 */
export async function downloadMedia(
  item: InstagramMedia,
  outputDir: string
): Promise<string> {
  const response = await fetch(item.media_url);
  if (!response.ok) {
    throw new Error(`画像の取得に失敗しました: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `${item.id}.jpg`;
  const filePath = path.join(outputDir, filename);
  await writeFile(filePath, buffer);
  return filePath;
}
