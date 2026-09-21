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
  demoMode?: boolean;
  filter: FeedFilter;
  metadata: EpubMetadata;
  items?: InstagramMedia[];
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

  const url = `/api/instagram/media?${params.toString()}`;

  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error ?? errorText;
    } catch {
      // Not JSON, use text as-is
    }
    throw new Error(`フィード取得に失敗しました: ${response.status} - ${errorMessage}`);
  }

  const payload = (await response.json()) as { items: InstagramMedia[] };
  return payload.items ?? [];
}

/**
 * Requests EPUB generation from the backend.
 */
export async function requestEpub(request: EpubRequest): Promise<Blob> {
  const response = await fetch(request.demoMode ? "/api/epub/demo" : "/api/epub", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error ?? errorText;
    } catch {
      // Not JSON, use text as-is
    }
    throw new Error(`EPUB生成に失敗しました: ${response.status} - ${errorMessage}`);
  }

  return response.blob();
}
