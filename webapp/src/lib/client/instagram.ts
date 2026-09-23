/**
 * @file InstagramおよびEPUB向けクライアントAPIラッパー。
 */
import type { CoverThemeId, EpubSortOrder } from "@/types/ui";

/**
 * Instagramメディア項目。
 */
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
};

/**
 * APIリクエスト用のフィード絞り込み条件。
 */
export type FeedFilter = {
  hashtag?: string;
  startDate?: string;
  endDate?: string;
  maxCount: number;
  sortOrder?: EpubSortOrder;
};

/**
 * EPUBメタデータのペイロード。
 */
export type EpubMetadata = {
  title: string;
  author: string;
  contact: string;
  instagramUrl: string;
  subtitle?: string;
  coverTheme?: CoverThemeId;
};

/**
 * EPUB生成リクエストのペイロード。
 */
export type EpubRequest = {
  demoMode?: boolean;
  filter: FeedFilter;
  metadata: EpubMetadata;
  coverTheme?: CoverThemeId;
  sortOrder?: EpubSortOrder;
  selectedMediaIds?: string[];
  excludedMediaIds?: string[];
  items?: InstagramMedia[];
};

/**
 * バックエンドから絞り込み済みのInstagramメディアを取得します。
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
      // JSONでない場合はレスポンステキストをそのまま使う
    }
    throw new Error(`フィード取得に失敗しました: ${response.status} - ${errorMessage}`);
  }

  const payload = (await response.json()) as { items: InstagramMedia[] };
  return payload.items ?? [];
}

/**
 * バックエンドへEPUB生成をリクエストします。
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
      // JSONでない場合はレスポンステキストをそのまま使う
    }
    throw new Error(`EPUB生成に失敗しました: ${response.status} - ${errorMessage}`);
  }

  return response.blob();
}
