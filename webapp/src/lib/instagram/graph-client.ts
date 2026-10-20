/**
 * @file Instagram `/me/media` エンドポイント用クライアント。
 *
 * 共通通信基盤 (`meta-api-client.ts`) を利用し、`/me/media` 固有のカーソルページネーション、
 * 期間下限（指定期間 または 最大2年前）、最大スキャン件数（500件）、目標件数到達による早期終了を制御します。
 */
import type { FeedFilter, InstagramMedia } from "@/lib/instagram/types";
import {
  InstagramGraphApiError,
  type MetaApiRetryOptions,
  type MetaGraphErrorDetail,
  requestMetaGraphApi,
} from "@/lib/instagram/meta-api-client";
import { getLogger } from "@/lib/logger";

export { InstagramGraphApiError };

const logger = getLogger("instagram.graph-client");

const MEDIA_ENDPOINT_PATH = "/me/media";
const MEDIA_FIELDS = ["id", "caption", "media_url", "permalink", "timestamp"].join(",");

/** Meta Graph API 1リクエストあたりの最大取得件数 */
export const DEFAULT_PAGE_LIMIT = 100;
/** 1回のフィード取得で API からスキャンする最大投稿数 */
export const DEFAULT_MAX_SCAN_ITEMS = 500;
/** 画面で指定された返却件数のデフォルト値 */
export const DEFAULT_MAX_COUNT = 200;
/** 期間指定なし時に遡る最大年数（2年） */
export const MAX_LOOKBACK_YEARS = 2;

/**
 * `/me/media` レスポンスの型。
 */
type GraphMediaResponse = {
  data?: InstagramMedia[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
  error?: MetaGraphErrorDetail;
};

/**
 * fetchGraphMedia のオプション設定。
 */
export type FetchGraphMediaOptions = MetaApiRetryOptions & {
  /** フィード絞り込み条件（期間・ハッシュタグ・取得件数） */
  filter?: Partial<FeedFilter>;
  /** 最大スキャン件数上限（デフォルト: 500件） */
  maxScanItems?: number;
  /** 1リクエストあたりの取得件数（デフォルト: 100件） */
  pageLimit?: number;
  /** 期間計算の基準日時（テスト用、デフォルト: 現在時刻） */
  now?: Date;
};

/**
 * 基準日時から指定年数前（デフォルト: 2年前）のミリ秒タイムスタンプを算出します。
 */
export function calculateMaxLookbackMs(
  baseDate: Date = new Date(),
  years: number = MAX_LOOKBACK_YEARS,
): number {
  const lookback = new Date(baseDate.getTime());
  lookback.setUTCFullYear(lookback.getUTCFullYear() - years);
  return lookback.getTime();
}

/**
 * 投稿アイテムがフィルタ条件（ハッシュタグ・期間）に合致するか判定します。
 */
function matchesFilterCriteria(
  item: InstagramMedia,
  params: {
    hashtag?: string;
    startMs?: number;
    endMs?: number;
  },
): boolean {
  if (params.hashtag) {
    const normalizedTag = params.hashtag.replace(/^#/, "").toLowerCase();
    const caption = (item.caption ?? "").toLowerCase();
    if (normalizedTag && !caption.includes(normalizedTag)) {
      return false;
    }
  }

  if (params.startMs !== undefined || params.endMs !== undefined) {
    const ts = new Date(item.timestamp).getTime();
    if (Number.isFinite(ts)) {
      if (params.startMs !== undefined && ts < params.startMs) {
        return false;
      }
      if (params.endMs !== undefined && ts > params.endMs) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Fetches media items from Instagram Graph API (`/me/media`).
 *
 * - `limit=100` のカーソルページネーションで新しい順に取得します。
 * - 期間指定がある場合は `startDate`〜`endDate`、期間指定がない場合は「現在から最大2年前」を下限とします。
 * - フィルタ合致件数が `maxCount` に達するか、累積スキャン件数が 500件に達するか、下限日時より古い投稿に到達した時点で早期終了します。
 */
export async function fetchGraphMedia(
  accessToken: string,
  options?: FetchGraphMediaOptions,
): Promise<InstagramMedia[]> {
  if (!accessToken) {
    throw new Error("アクセストークンがありません");
  }

  const filter = options?.filter;
  const isFilterProvided = filter !== undefined;
  const pageLimit = Math.min(
    Math.max(1, options?.pageLimit ?? DEFAULT_PAGE_LIMIT),
    DEFAULT_PAGE_LIMIT,
  );
  const maxScanItems = Math.max(1, options?.maxScanItems ?? DEFAULT_MAX_SCAN_ITEMS);
  const targetMaxCount = Math.max(1, filter?.maxCount ?? DEFAULT_MAX_COUNT);
  const baseNow = options?.now ?? new Date();

  // 下限日時: startDate 指定時はその開始時刻、filter 指定かつ startDate 未指定時は最大2年前
  const rawStartMs = filter?.startDate
    ? new Date(`${filter.startDate}T00:00:00Z`).getTime()
    : isFilterProvided
      ? calculateMaxLookbackMs(baseNow, MAX_LOOKBACK_YEARS)
      : undefined;
  const effectiveStartMs =
    rawStartMs !== undefined && Number.isFinite(rawStartMs) ? rawStartMs : undefined;

  // 上限日時: endDate 指定時はその終了時刻
  const rawEndMs = filter?.endDate ? new Date(`${filter.endDate}T23:59:59Z`).getTime() : undefined;
  const effectiveEndMs = rawEndMs !== undefined && Number.isFinite(rawEndMs) ? rawEndMs : undefined;

  const sinceSec = effectiveStartMs !== undefined ? Math.floor(effectiveStartMs / 1000) : undefined;
  const untilSec = effectiveEndMs !== undefined ? Math.floor(effectiveEndMs / 1000) : undefined;

  const seenIds = new Set<string>();
  const seenCursors = new Set<string>();
  const collectedItems: InstagramMedia[] = [];

  let scannedCount = 0;
  let matchedCount = 0;
  let pagesFetched = 0;
  let afterCursor: string | undefined;

  while (scannedCount < maxScanItems && matchedCount < targetMaxCount) {
    const remainingScanBudget = maxScanItems - scannedCount;
    const limit = Math.max(1, Math.min(pageLimit, remainingScanBudget));

    const payload = await requestMetaGraphApi<GraphMediaResponse>({
      path: MEDIA_ENDPOINT_PATH,
      accessToken,
      queryParams: {
        fields: MEDIA_FIELDS,
        limit,
        since: sinceSec,
        until: untilSec,
        after: afterCursor,
      },
      timeoutMs: options?.timeoutMs,
      retries: options?.retries,
      minRetryDelayMs: options?.minRetryDelayMs,
      maxRetryDelayMs: options?.maxRetryDelayMs,
      randomizeRetry: options?.randomizeRetry,
    });

    pagesFetched += 1;

    const pageItems = Array.isArray(payload?.data) ? payload.data : [];
    if (pageItems.length === 0) {
      break;
    }

    const itemsToProcess = pageItems.slice(0, remainingScanBudget);
    scannedCount += itemsToProcess.length;

    let encounteredOlderThanStartBound = false;

    for (const item of itemsToProcess) {
      const ts = new Date(item.timestamp).getTime();
      if (effectiveStartMs !== undefined && Number.isFinite(ts) && ts < effectiveStartMs) {
        encounteredOlderThanStartBound = true;
        continue;
      }

      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        collectedItems.push(item);

        if (
          matchesFilterCriteria(item, {
            hashtag: filter?.hashtag,
            startMs: effectiveStartMs,
            endMs: effectiveEndMs,
          })
        ) {
          matchedCount += 1;
        }
      }
    }

    // 1. 目標件数または最大スキャン件数に達した場合は終了
    if (matchedCount >= targetMaxCount || scannedCount >= maxScanItems) {
      break;
    }

    // 2. 下限日時（startDate または 2年前）より古い投稿に到達した場合は早期終了 (Early Exit)
    if (encounteredOlderThanStartBound) {
      break;
    }

    // 3. 次ページカーソルの確認と循環防止
    const nextCursor = payload.paging?.cursors?.after;
    const hasNextPage = Boolean(payload.paging?.next && nextCursor);
    if (!hasNextPage || !nextCursor || seenCursors.has(nextCursor)) {
      break;
    }

    seenCursors.add(nextCursor);
    afterCursor = nextCursor;
  }

  logger.info("Graph API media feed fetched", {
    count: collectedItems.length,
    matchedCount,
    scannedCount,
    pagesFetched,
    hasExplicitStartDate: Boolean(filter?.startDate),
    hasExplicitEndDate: Boolean(filter?.endDate),
  });

  return collectedItems;
}
