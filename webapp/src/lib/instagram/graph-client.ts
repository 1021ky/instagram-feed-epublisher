/**
 * @file Instagram Graph API client.
 */
import type { InstagramMedia } from "@/lib/instagram/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger("instagram.graph-client");

const fields = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "children{id,media_type,media_url,thumbnail_url}",
].join(",");

/**
 * Fetches media items from Instagram Graph API.
 */
export async function fetchGraphMedia(
  accessToken: string,
  limit: number = 500
): Promise<InstagramMedia[]> {
  if (!accessToken) {
    throw new Error("アクセストークンがありません");
  }

  const items: InstagramMedia[] = [];
  let url: string | undefined =
    `https://graph.instagram.com/me/media?fields=${fields}&access_token=${encodeURIComponent(
      accessToken
    )}&limit=100`;

  while (url && items.length < limit) {
    const safeUrl = url.replace(accessToken, "***");
    logger.debug("Graph API request", {
      url: safeUrl,
    });

    const response = await fetch(url);
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
    const pageItems = Array.isArray(payload.data) ? payload.data : [];
    items.push(...pageItems);
    logger.info("Graph API response received", { count: pageItems.length, total: items.length });

    url = payload.paging?.next;
  }

  return items;
}
