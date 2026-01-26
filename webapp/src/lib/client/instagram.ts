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

  const url = `/api/instagram/media?${params.toString()}`;
  console.debug("[client] feed request", { filter });

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
    console.error("[client] feed request failed", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`フィード取得に失敗しました: ${response.status} - ${errorMessage}`);
  }

  const payload = (await response.json()) as { items: InstagramMedia[] };
  console.info("[client] feed request succeeded", {
    status: response.status,
    count: payload.items?.length ?? 0,
  });
  return payload.items ?? [];
}

/**
 * Requests EPUB generation from the backend.
 */
export async function requestEpub(request: EpubRequest): Promise<Blob> {
  console.debug("[client] epub request", {
    filter: request.filter,
    title: request.metadata.title,
  });

  const response = await fetch("/api/epub", {
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
      console.error("[client] epub request error", { error: errorMessage });
    } catch {
      // Not JSON, use text as-is
    }
    console.error("[client] epub request failed", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`EPUB生成に失敗しました: ${response.status} - ${errorMessage}`);
  }

  console.info("[client] epub request succeeded", {
    status: response.status,
    contentType: response.headers.get("content-type"),
  });
  return response.blob();
}
