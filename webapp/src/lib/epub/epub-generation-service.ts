/**
 * @file EPUB生成ユースケースのオーケストレーションおよび一時ディレクトリ管理サービス。
 */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildEpub } from "@/lib/epub/epub-builder";
import {
  EpubRequestValidationError,
  type NormalizedEpubRequest,
} from "@/lib/epub/epub-request.schema";
import type { EpubInput } from "@/lib/epub/types";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { fetchGraphMedia } from "@/lib/instagram/graph-client";
import type { InstagramMedia } from "@/lib/instagram/types";

/**
 * `selectedMediaIds` / `excludedMediaIds` に基づき収録対象投稿を抽出します。
 */
export function selectMediaItems(
  items: InstagramMedia[],
  selectedMediaIds?: string[],
  excludedMediaIds?: string[],
): InstagramMedia[] {
  if (selectedMediaIds?.length) {
    const selectedIds = new Set(selectedMediaIds);
    return items.filter((item) => selectedIds.has(item.id));
  }

  if (excludedMediaIds?.length) {
    const excludedIds = new Set(excludedMediaIds);
    return items.filter((item) => !excludedIds.has(item.id));
  }

  return items;
}

/**
 * 一時作業ディレクトリを作成して EPUB を生成し、バイナリ Buffer を返却します。
 * 成否に関わらず一時ディレクトリは確実に削除します。
 */
export async function renderEpubToBuffer(input: EpubInput, tempPrefix = "epub-"): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(os.tmpdir(), tempPrefix));
  try {
    const epubPath = await buildEpub(input, workDir);
    return await readFile(epubPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

/**
 * 認証済みユーザーの Instagram フィードを取得・絞り込みし、EPUB バイナリを生成します。
 */
export async function generateFeedEpub(params: {
  accessToken: string;
  payload: NormalizedEpubRequest;
}): Promise<{ buffer: Buffer; itemCount: number }> {
  const { accessToken, payload } = params;
  const items = await fetchGraphMedia(accessToken, { filter: payload.filter });
  const filtered = applyFeedFilter(items, payload.filter);
  const selectedItems = selectMediaItems(
    filtered,
    payload.selectedMediaIds,
    payload.excludedMediaIds,
  );

  if (selectedItems.length === 0) {
    throw new EpubRequestValidationError(
      "投稿が見つかりません。フィルター条件を確認してください。",
    );
  }

  const buffer = await renderEpubToBuffer(
    {
      items: selectedItems,
      metadata: payload.metadata,
      coverTheme: payload.coverTheme,
      sortOrder: payload.sortOrder,
      ...(payload.selectedCarouselChildren
        ? { selectedCarouselChildren: payload.selectedCarouselChildren }
        : {}),
    },
    "epub-",
  );

  return { buffer, itemCount: selectedItems.length };
}
