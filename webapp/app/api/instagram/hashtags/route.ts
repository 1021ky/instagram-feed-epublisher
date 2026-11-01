/**
 * @file Instagram hashtag suggestions API route (`GET /api/instagram/hashtags`).
 */
import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import { fetchGraphMedia, InstagramGraphApiError } from "@/lib/instagram/graph-client";
import { extractHashtagsFromPosts, normalizeHashtagLimit } from "@/lib/instagram/hashtag-service";

const logger = getLogger("api.instagram.hashtags");

/** ハッシュタグ候補集計のために直近からスキャンする最大投稿数 */
const HASHTAG_SCAN_MAX_POSTS = 200;

/**
 * ログイン中ユーザーの直近投稿からよく使うハッシュタグ候補を集計して返却します。
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = normalizeHashtagLimit(url.searchParams.get("limit"));

    logger.info("Hashtag suggestions request received", { limit });

    const accessToken = await resolveInstagramAccessToken(request);
    const items = await fetchGraphMedia(accessToken, {
      maxScanItems: HASHTAG_SCAN_MAX_POSTS,
      filter: {
        maxCount: HASHTAG_SCAN_MAX_POSTS,
      },
    });

    const hashtags = extractHashtagsFromPosts(items, { limit });

    logger.info("Hashtag suggestions response sent", {
      scannedPosts: items.length,
      suggestionCount: hashtags.length,
    });

    return NextResponse.json({
      hashtags,
      scannedPosts: items.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    const status = error instanceof InstagramGraphApiError ? error.recommendedHttpStatus : 401;
    logger.error("Hashtag suggestions request failed", { error: message, status });
    return NextResponse.json({ error: message }, { status });
  }
}
