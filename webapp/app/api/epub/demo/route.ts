/**
 * @file デモ用EPUB生成API。
 */
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import { renderEpubToBuffer } from "@/lib/epub/epub-generation-service";
import {
  EpubRequestValidationError,
  parseEpubDemoRequestPayload,
} from "@/lib/epub/epub-request.schema";
import { createEpubDownloadResponse, toEpubErrorResponse } from "@/lib/epub/http-response";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import type { InstagramMedia } from "@/lib/instagram/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.epub.demo");
const sampleDemoItemsById = new Map(sampleDemoFeedData.posts.map((item) => [item.id, item]));

export const runtime = "nodejs";

function resolveAllowedDemoItems(items: InstagramMedia[]): InstagramMedia[] {
  return items.map((item) => {
    const sampleItem = sampleDemoItemsById.get(item.id);
    if (!sampleItem) {
      throw new EpubRequestValidationError("許可されていないデモデータです。");
    }

    if (
      sampleItem.media_url !== item.media_url ||
      sampleItem.permalink !== item.permalink ||
      sampleItem.timestamp !== item.timestamp ||
      sampleItem.caption !== item.caption
    ) {
      throw new EpubRequestValidationError("許可されていないデモデータです。");
    }

    return sampleItem;
  });
}

/**
 * 同梱のデモデータセットからEPUBを生成します。
 */
export async function POST(request: Request) {
  try {
    const payload = parseEpubDemoRequestPayload(await request.json());

    logger.debug("Demo EPUB generation requested", {
      filter: payload.filter,
      title: payload.metadata.title,
      itemCount: payload.items?.length ?? 0,
      coverTheme: payload.coverTheme,
      sortOrder: payload.sortOrder,
    });

    const items = payload.items?.length
      ? resolveAllowedDemoItems(payload.items)
      : sampleDemoFeedData.posts;
    const filtered = applyFeedFilter(items, payload.filter);

    if (filtered.length === 0) {
      throw new EpubRequestValidationError(
        "投稿が見つかりません。フィルター条件を確認してください。",
      );
    }

    const buffer = await renderEpubToBuffer(
      {
        items: filtered,
        metadata: payload.metadata,
        coverTheme: payload.coverTheme,
        sortOrder: payload.sortOrder,
        ...(payload.selectedCarouselChildren
          ? { selectedCarouselChildren: payload.selectedCarouselChildren }
          : {}),
      },
      "epub-demo-",
    );

    logger.info("Demo EPUB generation completed", { itemCount: filtered.length });
    return createEpubDownloadResponse(buffer, "instagram-feed-demo.epub");
  } catch (error) {
    return toEpubErrorResponse(error, logger, "Demo EPUB generation failed");
  }
}
