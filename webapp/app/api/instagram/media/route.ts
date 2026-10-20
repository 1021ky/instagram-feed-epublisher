/**
 * @file Instagram media API route.
 */
import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import {
  DEFAULT_MAX_COUNT,
  fetchGraphMedia,
  InstagramGraphApiError,
} from "@/lib/instagram/graph-client";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import type { FeedFilter } from "@/lib/instagram/types";

const logger = getLogger("api.instagram.media");

/**
 * Fetches media for the logged-in user.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawMaxCount = url.searchParams.get("maxCount");
    const maxCountParam = rawMaxCount !== null ? Number(rawMaxCount) : DEFAULT_MAX_COUNT;
    const filter: FeedFilter = {
      hashtag: url.searchParams.get("hashtag") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      maxCount:
        Number.isFinite(maxCountParam) && maxCountParam > 0 ? maxCountParam : DEFAULT_MAX_COUNT,
    };

    logger.info("Feed request received", { filter });

    const accessToken = await resolveInstagramAccessToken(request);
    const items = await fetchGraphMedia(accessToken, { filter });
    const filtered = applyFeedFilter(items, filter);

    logger.info("Feed response sent", {
      total: items.length,
      filtered: filtered.length,
    });

    return NextResponse.json({ items: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    const status = error instanceof InstagramGraphApiError ? error.recommendedHttpStatus : 401;
    logger.error("Feed request failed", { error: message, status });
    return NextResponse.json({ error: message }, { status });
  }
}
