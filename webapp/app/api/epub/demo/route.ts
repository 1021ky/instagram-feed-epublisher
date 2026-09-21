/**
 * @file Demo EPUB generation API.
 */
import { NextResponse } from "next/server";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import { buildEpub } from "@/lib/epub/epub-builder";
import type { EpubMetadata } from "@/lib/epub/types";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import type { FeedFilter, InstagramMedia } from "@/lib/instagram/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.epub.demo");
const sampleDemoItemsById = new Map(sampleDemoFeedData.posts.map((item) => [item.id, item]));

function resolveAllowedDemoItems(items: InstagramMedia[]) {
  return items.map((item) => {
    const sampleItem = sampleDemoItemsById.get(item.id);
    if (!sampleItem) {
      throw new Error("許可されていないデモデータです。");
    }

    if (
      sampleItem.media_url !== item.media_url ||
      sampleItem.permalink !== item.permalink ||
      sampleItem.timestamp !== item.timestamp ||
      sampleItem.caption !== item.caption
    ) {
      throw new Error("許可されていないデモデータです。");
    }

    return sampleItem;
  });
}

export const runtime = "nodejs";

/**
 * Builds an EPUB from the bundled demo dataset.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      filter: FeedFilter;
      items: InstagramMedia[];
      metadata: EpubMetadata;
    };

    logger.info("Demo EPUB generation started", {
      filter: payload.filter,
      title: payload.metadata.title,
      itemCount: payload.items?.length ?? 0,
    });

    const items = resolveAllowedDemoItems(payload.items ?? []);
    const filtered = applyFeedFilter(items, payload.filter);

    if (filtered.length === 0) {
      logger.error("No demo posts found for EPUB generation", { filter: payload.filter });
      return NextResponse.json(
        { error: "投稿が見つかりません。フィルター条件を確認してください。" },
        { status: 400 },
      );
    }

    const workDir = await mkdtemp(path.join(os.tmpdir(), "epub-demo-"));
    const epubPath = await buildEpub({ items: filtered, metadata: payload.metadata }, workDir);

    logger.info("Demo EPUB generation completed", { itemCount: filtered.length, path: epubPath });
    const epubBuffer = await readFile(epubPath);

    return new NextResponse(epubBuffer, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": "attachment; filename=instagram-feed-demo.epub",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error("Demo EPUB generation failed", { error: message, stack });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
