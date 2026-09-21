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
import { COVER_THEMES, DEFAULT_COVER_THEME_ID } from "@/lib/epub/themes";
import type { CoverThemeId, EpubMetadata, EpubSortOrder } from "@/lib/epub/types";

export const runtime = "nodejs";

/**
 * Builds an EPUB from the user's Instagram feed.
 */
export async function POST(request: Request) {
  try {
    const payload = validatePayload(await request.json());

    logger.info("EPUB generation started", {
      filter: payload.filter,
      title: payload.metadata.title,
    });

    const accessToken = await resolveInstagramAccessToken(request);
    const items = await fetchGraphMedia(accessToken);
    const filtered = applyFeedFilter(items, payload.filter);
    const selectedItems = filterSelectedItems(
      filtered,
      payload.selectedMediaIds,
      payload.excludedMediaIds,
    );

    if (selectedItems.length === 0) {
      logger.error("No posts found for EPUB generation", { filter: payload.filter });
      return NextResponse.json(
        { error: "投稿が見つかりません。フィルター条件を確認してください。" },
        { status: 400 },
      );
    }

    const workDir = await mkdtemp(path.join(os.tmpdir(), "epub-"));
    const epubPath = await buildEpub(
      {
        items: filtered,
        metadata: payload.metadata,
        coverTheme: payload.coverTheme,
        sortOrder: payload.sortOrder,
        selectedMediaIds: selectedItems.map((item) => item.id),
      },
      workDir,
    );

    logger.info("EPUB generation completed", { itemCount: selectedItems.length, path: epubPath });
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

type EpubRequestPayload = {
  filter: FeedFilter;
  metadata: EpubMetadata;
  coverTheme: CoverThemeId;
  sortOrder: EpubSortOrder;
  selectedMediaIds?: string[];
  excludedMediaIds?: string[];
};

function validatePayload(value: unknown): EpubRequestPayload {
  if (!isObject(value) || !isObject(value.filter) || !isObject(value.metadata)) {
    throw new Error("EPUB生成リクエストの形式が不正です");
  }

  const maxCount = Number(value.filter.maxCount);
  if (!Number.isFinite(maxCount) || maxCount <= 0) {
    throw new Error("filter.maxCount は 1 以上の数値で指定してください");
  }

  const coverTheme = value.coverTheme ?? DEFAULT_COVER_THEME_ID;
  if (!isCoverThemeId(coverTheme)) {
    throw new Error("coverTheme の値が不正です");
  }

  const sortOrder = value.sortOrder ?? "desc";
  if (!isSortOrder(sortOrder)) {
    throw new Error("sortOrder の値が不正です");
  }

  return {
    filter: {
      hashtag: optionalString(value.filter.hashtag),
      startDate: optionalString(value.filter.startDate),
      endDate: optionalString(value.filter.endDate),
      maxCount,
    },
    metadata: {
      title: requiredString(value.metadata.title, "metadata.title"),
      author: requiredString(value.metadata.author, "metadata.author"),
      contact: requiredString(value.metadata.contact, "metadata.contact"),
      instagramUrl: requiredString(value.metadata.instagramUrl, "metadata.instagramUrl"),
      language: optionalString(value.metadata.language),
    },
    coverTheme,
    sortOrder,
    selectedMediaIds: optionalStringArray(value.selectedMediaIds, "selectedMediaIds"),
    excludedMediaIds: optionalStringArray(value.excludedMediaIds, "excludedMediaIds"),
  };
}

function filterSelectedItems(
  items: Awaited<ReturnType<typeof fetchGraphMedia>>,
  selectedMediaIds?: string[],
  excludedMediaIds?: string[],
) {
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoverThemeId(value: unknown): value is CoverThemeId {
  return typeof value === "string" && value in COVER_THEMES;
}

function isSortOrder(value: unknown): value is EpubSortOrder {
  return value === "asc" || value === "desc";
}

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} は必須の文字列です`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalStringArray(value: unknown, fieldName: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${fieldName} は文字列配列で指定してください`);
  }

  return [...new Set(value)];
}
