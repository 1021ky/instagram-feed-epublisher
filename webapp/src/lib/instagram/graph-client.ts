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

  const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${encodeURIComponent(
    accessToken
  )}`;
  const safeUrl = `https://graph.instagram.com/me/media?fields=${fields}`;
  logger.debug("Graph API request", {
    url: safeUrl,
    accessTokenLength: accessToken.length,
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

  const payload = (await response.json()) as { data?: InstagramMedia[] };
  const items = Array.isArray(payload.data) ? payload.data : [];
  logger.info("Graph API response received", { count: items.length });
  return items;
}
