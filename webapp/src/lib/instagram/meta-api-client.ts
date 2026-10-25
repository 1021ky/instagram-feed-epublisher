/**
 * @file Meta (Instagram) Graph API 共通 HTTP クライアント基盤。
 *
 * タイムアウト制御、Exponential Backoff リトライ、Meta API 固有のエラー分類、
 * アクセストークンの秘匿（マスク）、構造化ロギングを一元的に提供します。
 * `/me/media` に限らず、今後追加される他の Meta Graph API エンドポイントからも共通利用できます。
 */
import pRetry, { AbortError } from "p-retry";
import { getLogger } from "@/lib/logger";

const logger = getLogger("instagram.meta-api-client");

export const META_GRAPH_API_BASE_URL = "https://graph.instagram.com";

/**
 * 実行時の Meta Graph API ベース URL を解決します。
 * E2E テストや契約テスト時に `META_GRAPH_API_BASE_URL` 環境変数でモックサーバーへ切り替え可能です。
 */
export function resolveMetaGraphApiBaseUrl(): string {
  const configured = process.env.META_GRAPH_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return META_GRAPH_API_BASE_URL;
}

/** 1リクエストあたりのデフォルトタイムアウト（10秒） */
export const DEFAULT_TIMEOUT_MS = 10_000;
/** デフォルトの最大リトライ回数（初回 + 3回リトライ = 最大4回試行） */
export const DEFAULT_RETRY_COUNT = 3;
/** Exponential Backoff の初回待機時間（1秒） */
export const DEFAULT_MIN_RETRY_DELAY_MS = 1_000;
/** Exponential Backoff の最大待機時間（10秒） */
export const DEFAULT_MAX_RETRY_DELAY_MS = 10_000;

const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_META_ERROR_CODES = new Set([1, 2, 4, 17, 32, 341, 613]);
const RATE_LIMIT_META_ERROR_CODES = new Set([4, 17, 32, 341, 613]);
const AUTH_META_ERROR_CODES = new Set([10, 190]);

/**
 * Meta Graph API のエラーオブジェクト構造。
 */
export type MetaGraphErrorDetail = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  is_transient?: boolean;
  fbtrace_id?: string;
};

/**
 * エラー種別の分類。
 */
export type GraphErrorKind =
  | "auth"
  | "rate_limit"
  | "timeout"
  | "network"
  | "upstream"
  | "bad_request";

/**
 * エラー分類結果。
 */
export type GraphErrorClassification = {
  kind: GraphErrorKind;
  retryable: boolean;
};

/**
 * Instagram / Meta Graph API 共通のエラークラス。
 */
export class InstagramGraphApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly subcode?: number;
  readonly isTransient: boolean;
  readonly fbtraceId?: string;
  readonly kind: GraphErrorKind;
  readonly retryAfterMs?: number;

  constructor(params: {
    message: string;
    status: number;
    kind: GraphErrorKind;
    code?: number;
    subcode?: number;
    isTransient?: boolean;
    fbtraceId?: string;
    retryAfterMs?: number;
    cause?: unknown;
  }) {
    super(params.message, params.cause ? { cause: params.cause } : undefined);
    this.name = "InstagramGraphApiError";
    this.status = params.status;
    this.kind = params.kind;
    this.code = params.code;
    this.subcode = params.subcode;
    this.isTransient = params.isTransient ?? false;
    this.fbtraceId = params.fbtraceId;
    this.retryAfterMs = params.retryAfterMs;
  }

  /**
   * クライアントへ返却する推奨 HTTP ステータスコード。
   */
  get recommendedHttpStatus(): number {
    switch (this.kind) {
      case "auth":
        return 401;
      case "rate_limit":
        return 429;
      case "timeout":
        return 504;
      case "bad_request":
        return 400;
      case "network":
      case "upstream":
      default:
        return 502;
    }
  }
}

/**
 * HTTP ステータスおよび Meta Graph API エラーペイロードからエラー種別とリトライ可否を判定します。
 */
export function classifyGraphError(
  status: number,
  errorDetail?: MetaGraphErrorDetail,
): GraphErrorClassification {
  const code = errorDetail?.code;
  const isTransient = errorDetail?.is_transient === true;

  // 1. レート制限エラー（Meta コード 4, 17, 32, 341, 613 または HTTP 429）
  if (status === 429 || (code !== undefined && RATE_LIMIT_META_ERROR_CODES.has(code))) {
    return { kind: "rate_limit", retryable: true };
  }

  // 2. Meta が明示的に一時的障害とフラグ付けしたもの、またはコード 1, 2
  if (isTransient || (code !== undefined && RETRYABLE_META_ERROR_CODES.has(code))) {
    return { kind: "upstream", retryable: true };
  }

  // 3. 認証・権限エラー（HTTP 401、またはコード 190, 10, 200-299）
  if (
    status === 401 ||
    (code !== undefined && (AUTH_META_ERROR_CODES.has(code) || (code >= 200 && code < 300)))
  ) {
    return { kind: "auth", retryable: false };
  }

  // 4. タイムアウト系 HTTP ステータス
  if (status === 408 || status === 504) {
    return { kind: "timeout", retryable: true };
  }

  // 5. その他の Retryable HTTP ステータス（500, 502, 503）
  if (RETRYABLE_HTTP_STATUSES.has(status)) {
    return { kind: "upstream", retryable: true };
  }

  // 6. その他の 4xx 等は恒久エラー（リトライ非対象）
  return { kind: "bad_request", retryable: false };
}

/**
 * Meta Graph API のエラーがリトライ対象かどうかを判定するヘルパー関数。
 */
export function isRetryableGraphError(status: number, errorDetail?: MetaGraphErrorDetail): boolean {
  return classifyGraphError(status, errorDetail).retryable;
}

/**
 * 文字列からアクセストークンをマスク・除去します。
 */
export function redactAccessToken(text: string, accessToken: string): string {
  if (!text || !accessToken) {
    return text;
  }
  return text
    .replaceAll(accessToken, "[REDACTED]")
    .replaceAll(encodeURIComponent(accessToken), "[REDACTED]");
}

/**
 * Retry-After ヘッダー値をミリ秒に変換します。
 */
function parseRetryAfterMs(headers: Headers | undefined, maxDelayMs: number): number | undefined {
  const raw = headers?.get?.("retry-after");
  if (!raw) {
    return undefined;
  }
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.round(seconds * 1000), maxDelayMs);
  }
  return undefined;
}

/**
 * 待機用の Promise を返します。
 */
function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * レスポンステキストから Meta Graph API のエラー詳細を安全に抽出します。
 */
function parseErrorDetail(bodyText: string): MetaGraphErrorDetail | undefined {
  if (!bodyText) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(bodyText) as { error?: MetaGraphErrorDetail };
    if (parsed && typeof parsed === "object" && parsed.error && typeof parsed.error === "object") {
      return parsed.error;
    }
  } catch {
    // 非JSONレスポンスの場合は undefined
  }
  return undefined;
}

/**
 * Meta Graph API リクエスト用の URL とログ出力用セーフ URL（トークン除外）を構築します。
 */
export function buildMetaApiUrls(params: {
  path: string;
  accessToken: string;
  queryParams?: Record<string, string | number | undefined>;
}): { url: string; safeUrl: string } {
  const normalizedPath = params.path.startsWith("/") ? params.path : `/${params.path}`;
  const query = new URLSearchParams();

  if (params.queryParams) {
    for (const [key, value] of Object.entries(params.queryParams)) {
      if (value !== undefined && value !== "") {
        query.set(key, String(value));
      }
    }
  }

  const baseUrl = resolveMetaGraphApiBaseUrl();
  const safeQueryStr = query.toString();
  const safeUrl = `${baseUrl}${normalizedPath}${safeQueryStr ? `?${safeQueryStr}` : ""}`;

  query.set("access_token", params.accessToken);
  const url = `${baseUrl}${normalizedPath}?${query.toString()}`;

  return { url, safeUrl };
}

/**
 * Meta Graph API 共通のリトライ・タイムアウトオプション。
 */
export type MetaApiRetryOptions = {
  /** 1リクエストあたりのタイムアウトミリ秒（デフォルト: 10,000ms） */
  timeoutMs?: number;
  /** 最大リトライ回数（デフォルト: 3回） */
  retries?: number;
  /** 初回リトライ待機ミリ秒（デフォルト: 1,000ms） */
  minRetryDelayMs?: number;
  /** 最大リトライ待機ミリ秒（デフォルト: 10,000ms） */
  maxRetryDelayMs?: number;
  /** Jitter（ランダム化）の有無（デフォルト: true） */
  randomizeRetry?: boolean;
};

/**
 * Meta Graph API リクエスト引数。
 */
export type MetaApiRequestParams = MetaApiRetryOptions & {
  /** エンドポイントパス（例: `/me/media`, `/me`） */
  path: string;
  /** Instagram アクセストークン */
  accessToken: string;
  /** クエリパラメータ（`access_token` 以外） */
  queryParams?: Record<string, string | number | undefined>;
};

/**
 * Meta Graph API に対してタイムアウトおよび Exponential Backoff リトライ付きで GET リクエストを実行します。
 */
export async function requestMetaGraphApi<T = Record<string, unknown>>(
  params: MetaApiRequestParams,
): Promise<T> {
  if (!params.accessToken) {
    throw new Error("アクセストークンがありません");
  }

  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = params.retries ?? DEFAULT_RETRY_COUNT;
  const minRetryDelayMs = params.minRetryDelayMs ?? DEFAULT_MIN_RETRY_DELAY_MS;
  const maxRetryDelayMs = params.maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
  const randomizeRetry = params.randomizeRetry ?? true;

  const { url, safeUrl } = buildMetaApiUrls({
    path: params.path,
    accessToken: params.accessToken,
    queryParams: params.queryParams,
  });

  logger.debug("Graph API request", {
    path: params.path,
    url: safeUrl,
    accessTokenLength: params.accessToken.length,
  });

  return pRetry(
    async (attemptNumber) => {
      let response: Response;
      try {
        response = await fetch(url, {
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        const isTimeout =
          err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
        const rawMessage = err instanceof Error ? err.message : String(err);
        const safeMessage = redactAccessToken(rawMessage, params.accessToken);

        throw new InstagramGraphApiError({
          message: isTimeout
            ? `Graph API request timed out after ${timeoutMs}ms`
            : `Graph API network error: ${safeMessage}`,
          status: isTimeout ? 504 : 502,
          kind: isTimeout ? "timeout" : "network",
          isTransient: true,
          cause: err,
        });
      }

      if (!response.ok) {
        const rawErrorText = typeof response.text === "function" ? await response.text() : "";
        const safeErrorText = redactAccessToken(rawErrorText, params.accessToken);
        const errorDetail = parseErrorDetail(safeErrorText);
        const classification = classifyGraphError(response.status, errorDetail);
        const retryAfterMs = parseRetryAfterMs(response.headers, maxRetryDelayMs);

        const detailMsg = errorDetail?.message
          ? redactAccessToken(errorDetail.message, params.accessToken)
          : undefined;

        const graphError = new InstagramGraphApiError({
          message: `Graph API error: ${response.status}${detailMsg ? ` (${detailMsg})` : ""}`,
          status: response.status,
          kind: classification.kind,
          code: errorDetail?.code,
          subcode: errorDetail?.error_subcode,
          isTransient: classification.retryable,
          fbtraceId: errorDetail?.fbtrace_id,
          retryAfterMs,
        });

        if (!classification.retryable) {
          logger.error("Graph API request failed with non-retryable error", {
            path: params.path,
            status: response.status,
            kind: classification.kind,
            code: errorDetail?.code,
            subcode: errorDetail?.error_subcode,
            fbtraceId: errorDetail?.fbtrace_id,
            attemptNumber,
          });
          throw new AbortError(graphError);
        }

        throw graphError;
      }

      const payload = (await response.json()) as T & { error?: MetaGraphErrorDetail };

      // HTTP 200 でもボディ内に error オブジェクトが含まれるケースの防御
      if (payload && typeof payload === "object" && payload.error) {
        const errorDetail = payload.error;
        const classification = classifyGraphError(200, errorDetail);
        const detailMsg = errorDetail.message
          ? redactAccessToken(errorDetail.message, params.accessToken)
          : undefined;

        const graphError = new InstagramGraphApiError({
          message: `Graph API error: ${errorDetail.code ?? 200}${detailMsg ? ` (${detailMsg})` : ""}`,
          status: classification.kind === "auth" ? 401 : 502,
          kind: classification.kind,
          code: errorDetail.code,
          subcode: errorDetail.error_subcode,
          isTransient: classification.retryable,
          fbtraceId: errorDetail.fbtrace_id,
        });

        if (!classification.retryable) {
          throw new AbortError(graphError);
        }
        throw graphError;
      }

      return payload;
    },
    {
      retries,
      factor: 2,
      minTimeout: minRetryDelayMs,
      maxTimeout: maxRetryDelayMs,
      randomize: randomizeRetry,
      onFailedAttempt: async ({ error, attemptNumber, retriesLeft, retryDelay }) => {
        const graphErr = error instanceof InstagramGraphApiError ? error : undefined;
        if (retriesLeft > 0) {
          logger.info("Graph API request transient failure, retrying", {
            path: params.path,
            attemptNumber,
            retriesLeft,
            retryDelayMs: retryDelay,
            status: graphErr?.status,
            kind: graphErr?.kind,
            code: graphErr?.code,
            fbtraceId: graphErr?.fbtraceId,
          });
          if (graphErr?.retryAfterMs && graphErr.retryAfterMs > retryDelay) {
            await sleep(graphErr.retryAfterMs - retryDelay);
          }
        } else {
          logger.error("Graph API request exhausted all retries", {
            path: params.path,
            attemptNumber,
            status: graphErr?.status,
            kind: graphErr?.kind,
            code: graphErr?.code,
            subcode: graphErr?.subcode,
            fbtraceId: graphErr?.fbtraceId,
            error: error.message,
          });
        }
      },
    },
  );
}
