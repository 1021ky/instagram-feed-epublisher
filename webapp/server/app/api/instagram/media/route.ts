/**
 * @file Instagram media API route.
 */
import { NextResponse } from "next/server";
import { fetchGraphMedia } from "@/lib/instagram/graph-client";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import type { FeedFilter } from "@/lib/instagram/types";

/**
 * Fetches media for the logged-in user.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const maxCountParam = Number(url.searchParams.get("maxCount") ?? 100);
    const filter: FeedFilter = {
      hashtag: url.searchParams.get("hashtag") ?? undefined,
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
      maxCount: Number.isFinite(maxCountParam) ? maxCountParam : 100,
    };

    console.info("[instagram] feed request", {
      filter,
    });

    const accessToken = await resolveInstagramAccessToken(request);
    const items = await fetchGraphMedia(accessToken);
    const filtered = applyFeedFilter(items, filter);

    console.info("[instagram] feed response", {
      total: items.length,
      filtered: filtered.length,
    });

    return NextResponse.json({ items: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    console.error("[instagram] feed error", {
      message,
    });
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
