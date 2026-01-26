/**
 * @file Client-side API wrappers for Instagram and EPUB.
 */

/**
 * Instagram media item.
 */
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
};

/**
 * Feed filter for API requests.
 */
export type FeedFilter = {
  hashtag?: string;
  startDate?: string;
  endDate?: string;
  maxCount: number;
};

/**
 * EPUB metadata payload.
 */
export type EpubMetadata = {
  title: string;
  author: string;
  contact: string;
  instagramUrl: string;
};

/**
 * EPUB request payload.
 */
export type EpubRequest = {
  filter: FeedFilter;
  metadata: EpubMetadata;
};

/**
 * Fetches filtered Instagram media from the backend.
 */
export async function fetchInstagramFeed(filter: FeedFilter): Promise<InstagramMedia[]> {
  const params = new URLSearchParams({
    maxCount: String(filter.maxCount),
  });
  if (filter.hashtag) params.set("hashtag", filter.hashtag);
  if (filter.startDate) params.set("startDate", filter.startDate);
  if (filter.endDate) params.set("endDate", filter.endDate);

  const response = await fetch(`/api/instagram/media?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("フィード取得に失敗しました", { cause: response });
  }
  const payload = (await response.json()) as { items: InstagramMedia[] };
  return payload.items ?? [];
}

/**
 * Requests EPUB generation from the backend.
 */
export async function requestEpub(request: EpubRequest): Promise<Blob> {
  const response = await fetch("/api/epub", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error("EPUB生成に失敗しました");
  }
  return response.blob();
}
