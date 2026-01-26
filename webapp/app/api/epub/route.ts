/**
 * @file EPUB generation API.
 */
import { NextResponse } from "next/server";
import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.epub");
import type { FeedFilter } from "@/lib/instagram/types";
import { fetchGraphMedia } from "@/lib/instagram/graph-client";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import { buildEpub } from "@/lib/epub/epub-builder";
import type { EpubMetadata } from "@/lib/epub/types";

export const runtime = "nodejs";

/**
 * Builds an EPUB from the user's Instagram feed.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      filter: FeedFilter;
      metadata: EpubMetadata;
    };

    logger.info("EPUB generation started", {
      filter: payload.filter,
      title: payload.metadata.title,
    });

    const accessToken = await resolveInstagramAccessToken(request);
    const items = await fetchGraphMedia(accessToken);
    const filtered = applyFeedFilter(items, payload.filter);

    if (filtered.length === 0) {
      logger.error("No posts found for EPUB generation", { filter: payload.filter });
      return NextResponse.json(
        { error: "投稿が見つかりません。フィルター条件を確認してください。" },
        { status: 400 }
      );
    }

    const workDir = await mkdtemp(path.join(os.tmpdir(), "epub-"));
    const epubPath = await buildEpub({ items: filtered, metadata: payload.metadata }, workDir);

    logger.info("EPUB generation completed", { itemCount: filtered.length, path: epubPath });
    const epubBuffer = await readFile(epubPath);

    return new NextResponse(epubBuffer, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": "attachment; filename=instagram-feed.epub",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error("EPUB generation failed", { error: message, stack });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
