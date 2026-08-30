/**
 * @file Instagram Graph API client.
 */
import type { InstagramMedia } from "@/lib/instagram/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger("instagram.graph-client");

const fields = ["id", "caption", "media_url", "permalink", "timestamp"].join(",");

/**
 * Fetches media items from Instagram Graph API.
 */
export async function fetchGraphMedia(accessToken: string): Promise<InstagramMedia[]> {
  if (!accessToken) {
    throw new Error("アクセストークンがありません");
  }

  let nextUrl: string | undefined =
    `https://graph.instagram.com/me/media?fields=${fields}&limit=100&access_token=${encodeURIComponent(
      accessToken
    )}`;
  const allItems: InstagramMedia[] = [];

  while (nextUrl) {
    const safeUrl = nextUrl.replace(/access_token=[^&]+/, "access_token=***");
    logger.info("Graph API request started", { url: safeUrl });

    const response = await fetch(nextUrl);
    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Graph API request failed", {
        status: response.status,
        body: errorText,
      });
      throw new Error(`Graph API error: ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: InstagramMedia[];
      paging?: { next?: string };
    };
    const items = Array.isArray(payload.data) ? payload.data : [];
    allItems.push(...items);

    logger.info("Graph API page received", {
      pageCount: items.length,
      accumulatedCount: allItems.length,
      hasNextPage: Boolean(payload.paging?.next),
      itemsPreview: items.map((i) => ({
        id: i.id,
        timestamp: i.timestamp,
        caption: i.caption ? i.caption.slice(0, 60) : "(no caption)",
      })),
    });

    nextUrl = payload.paging?.next;
    if (allItems.length >= 1000) {
      break;
    }
  }

  logger.info("Graph API fetch completed", { totalCount: allItems.length });
  return allItems;
}
