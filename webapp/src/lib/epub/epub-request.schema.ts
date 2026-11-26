/**
 * @file EPUB生成API向け Zod v4 スキーマ定義および入力正規化パーサー。
 */
import { z } from "zod";
import { COVER_THEMES, DEFAULT_COVER_THEME_ID } from "@/lib/epub/themes";
import type { CoverThemeId, EpubMetadata, EpubSortOrder } from "@/lib/epub/types";
import type { FeedFilter, InstagramMedia } from "@/lib/instagram/types";

const coverThemeIds = COVER_THEMES.map((theme) => theme.id) as [CoverThemeId, ...CoverThemeId[]];

/**
 * EPUB生成リクエストの入力検証・制約違反を表す境界エラー。
 */
export class EpubRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EpubRequestValidationError";
  }
}

/**
 * 表紙カラーテーマIDの Zod スキーマ。
 */
export const CoverThemeIdSchema = z
  .enum(coverThemeIds, {
    error: "coverTheme の値が不正です",
  })
  .meta({
    id: "CoverThemeId",
    description: "EPUB表紙のカラーテーマ識別子",
    example: DEFAULT_COVER_THEME_ID,
  });

/**
 * 投稿並び順の Zod スキーマ。
 */
export const EpubSortOrderSchema = z
  .enum(["asc", "desc"], {
    error: "sortOrder の値が不正です",
  })
  .meta({
    id: "EpubSortOrder",
    description: "EPUB内の投稿並び順（asc: 古い順 / desc: 新しい順）",
    example: "desc",
  });

/**
 * フィード絞り込み条件の Zod スキーマ。
 */
export const EpubFilterSchema = z
  .object({
    hashtag: z.string().optional().meta({
      description: "絞り込み対象のハッシュタグ（先頭 # 任意）",
      example: "100日チャレンジ",
    }),
    startDate: z.string().optional().meta({
      description: "取得開始日（YYYY-MM-DD）",
      example: "2026-09-01",
    }),
    endDate: z.string().optional().meta({
      description: "取得終了日（YYYY-MM-DD）",
      example: "2026-10-20",
    }),
    maxCount: z
      .number({ error: "filter.maxCount は 1 以上の数値で指定してください" })
      .finite("filter.maxCount は 1 以上の数値で指定してください")
      .positive("filter.maxCount は 1 以上の数値で指定してください")
      .meta({
        description: "収録する最大投稿件数（1以上）",
        example: 200,
      }),
    sortOrder: EpubSortOrderSchema.optional(),
  })
  .meta({
    id: "EpubFeedFilter",
    description: "EPUB生成時のフィード絞り込み条件",
  });

/**
 * 書籍タイトル単体の必須バリデーションスキーマ（UI と API で共有）。
 */
export const EpubTitleSchema = z
  .string({ error: "metadata.title は必須の文字列です" })
  .trim()
  .min(1, "書籍タイトルを入力してください")
  .meta({
    description: "EPUB書籍のタイトル（空文字・空白のみ不可）",
    example: "@exampleの投稿記録",
  });

/**
 * EPUBメタデータの Zod スキーマ。
 */
export const EpubMetadataSchema = z
  .object({
    title: EpubTitleSchema,
    subtitle: z.string().optional().meta({
      description: "書籍のサブタイトル（任意）",
      example: "100日チャレンジの振り返り",
    }),
    author: z
      .string({ error: "metadata.author は文字列で指定してください" })
      .optional()
      .default("")
      .meta({
        description: "著者名（任意）",
        example: "@example",
      }),
    contact: z
      .string({ error: "metadata.contact は文字列で指定してください" })
      .optional()
      .default("")
      .meta({
        description: "連絡先（任意）",
        example: "contact@example.com",
      }),
    instagramUrl: z
      .string({ error: "metadata.instagramUrl は文字列で指定してください" })
      .optional()
      .default("")
      .meta({
        description: "InstagramプロフィールURL（任意）",
        example: "https://instagram.com/example",
      }),
    language: z.string().optional().meta({
      description: "EPUB言語コード（未指定時は ja）",
      example: "ja",
    }),
    coverTheme: CoverThemeIdSchema.optional(),
  })
  .meta({
    id: "EpubMetadata",
    description: "EPUB書籍のメタデータ設定",
  });

const InstagramMediaChildSchema = z.object({
  id: z.string().min(1),
  media_type: z.enum(["IMAGE", "VIDEO"]),
  media_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
});

const InstagramMediaItemSchema = z
  .object({
    id: z.string().min(1),
    caption: z.string().optional(),
    media_type: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]).optional(),
    media_url: z.string().optional(),
    thumbnail_url: z.string().optional(),
    permalink: z.string().min(1),
    timestamp: z.string().min(1),
    children: z
      .object({
        data: z.array(InstagramMediaChildSchema),
      })
      .optional(),
  })
  .meta({
    id: "EpubDemoMediaItem",
    description: "デモ用EPUB生成リクエストに含まれる投稿データ",
  });

const BaseEpubRequestFields = {
  filter: EpubFilterSchema,
  metadata: EpubMetadataSchema,
  coverTheme: CoverThemeIdSchema.optional(),
  sortOrder: EpubSortOrderSchema.optional(),
  selectedCarouselChildren: z.record(z.string(), z.array(z.string())).nullish().meta({
    description: "カルーセル投稿ごとの収録対象子メディアIDマップ",
  }),
};

/**
 * `POST /api/epub` リクエストボディの Zod スキーマ。
 */
export const EpubRequestBodySchema = z
  .object({
    ...BaseEpubRequestFields,
    selectedMediaIds: z
      .array(z.string(), { error: "selectedMediaIds は文字列配列で指定してください" })
      .nullish()
      .meta({
        description: "収録対象として明示選択された投稿ID一覧（excludedMediaIds と併用不可）",
      }),
    excludedMediaIds: z
      .array(z.string(), { error: "excludedMediaIds は文字列配列で指定してください" })
      .nullish()
      .meta({
        description: "除外対象として指定された投稿ID一覧（selectedMediaIds と併用不可）",
      }),
  })
  .superRefine((val, ctx) => {
    if (val.selectedMediaIds?.length && val.excludedMediaIds?.length) {
      ctx.addIssue({
        code: "custom",
        message: "selectedMediaIds と excludedMediaIds を同時に指定することはできません",
      });
    }
  })
  .meta({
    id: "EpubRequestBody",
    description: "認証済みユーザーのInstagramフィードからEPUBを生成するリクエスト",
  });

/**
 * `POST /api/epub/demo` リクエストボディの Zod スキーマ。
 */
export const EpubDemoRequestBodySchema = z
  .object({
    ...BaseEpubRequestFields,
    items: z.array(InstagramMediaItemSchema).optional().meta({
      description: "生成対象に選択されたデモ投稿一覧（未指定時は同梱サンプル全件）",
    }),
  })
  .meta({
    id: "EpubDemoRequestBody",
    description: "デモデータセットからEPUBを生成するリクエスト",
  });

/**
 * EPUB生成API共通のエラーレスポンス Zod スキーマ。
 */
export const EpubErrorResponseSchema = z
  .object({
    error: z.string().min(1).meta({
      description: "利用者向けエラーメッセージ",
      example: "投稿が見つかりません。フィルター条件を確認してください。",
    }),
  })
  .meta({
    id: "EpubErrorResponse",
    description: "EPUB生成APIのエラーレスポンス",
  });

export type EpubRequestBody = z.input<typeof EpubRequestBodySchema>;
export type EpubDemoRequestBody = z.input<typeof EpubDemoRequestBodySchema>;

export type NormalizedEpubRequest = {
  filter: FeedFilter;
  metadata: EpubMetadata;
  coverTheme: CoverThemeId;
  sortOrder: EpubSortOrder;
  selectedMediaIds?: string[];
  excludedMediaIds?: string[];
  selectedCarouselChildren?: Record<string, string[]>;
};

export type NormalizedEpubDemoRequest = Omit<
  NormalizedEpubRequest,
  "selectedMediaIds" | "excludedMediaIds"
> & {
  items?: InstagramMedia[];
};

/**
 * クライアント UI とサーバー双方で利用できる書籍タイトル検証ヘルパー。
 * 有効な場合は `null`、不正な場合はエラーメッセージを返します。
 */
export function validateEpubTitle(title: string): string | null {
  const result = EpubTitleSchema.safeParse(title);
  if (result.success) {
    return null;
  }
  return result.error.issues[0]?.message ?? "書籍タイトルを入力してください";
}

function optionalNonEmptyString(value?: string): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function normalizeStringArray(value?: string[] | null): string[] | undefined {
  if (!value || value.length === 0) {
    return undefined;
  }
  const deduplicated = [...new Set(value)];
  return deduplicated.length > 0 ? deduplicated : undefined;
}

function normalizeCarouselSelection(
  value?: Record<string, string[]> | null,
): Record<string, string[]> | undefined {
  if (!value) {
    return undefined;
  }
  const record: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = [...new Set(entry)];
  }
  return Object.keys(record).length > 0 ? record : undefined;
}

function normalizeCommonFields(
  parsed: z.output<typeof EpubRequestBodySchema> | z.output<typeof EpubDemoRequestBodySchema>,
) {
  const coverTheme = parsed.coverTheme ?? parsed.metadata.coverTheme ?? DEFAULT_COVER_THEME_ID;
  const sortOrder = parsed.sortOrder ?? parsed.filter.sortOrder ?? "desc";

  return {
    filter: {
      hashtag: optionalNonEmptyString(parsed.filter.hashtag),
      startDate: optionalNonEmptyString(parsed.filter.startDate),
      endDate: optionalNonEmptyString(parsed.filter.endDate),
      maxCount: parsed.filter.maxCount,
    },
    metadata: {
      title: parsed.metadata.title,
      author: parsed.metadata.author,
      contact: parsed.metadata.contact,
      instagramUrl: parsed.metadata.instagramUrl,
      language: optionalNonEmptyString(parsed.metadata.language),
      ...(optionalNonEmptyString(parsed.metadata.subtitle)
        ? { subtitle: optionalNonEmptyString(parsed.metadata.subtitle) }
        : {}),
      coverTheme,
    },
    coverTheme,
    sortOrder,
    selectedCarouselChildren: normalizeCarouselSelection(parsed.selectedCarouselChildren),
  };
}

function formatZodIssueMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return "EPUB生成リクエストの形式が不正です";
  }
  // ルートオブジェクト全体が不正な場合は統一メッセージを返す
  if (firstIssue.path.length === 0 && firstIssue.code === "invalid_type") {
    return "EPUB生成リクエストの形式が不正です";
  }
  return firstIssue.message;
}

/**
 * `POST /api/epub` の未知のリクエストボディを検証・正規化します。
 */
export function parseEpubRequestPayload(raw: unknown): NormalizedEpubRequest {
  const parsed = EpubRequestBodySchema.safeParse(raw);
  if (!parsed.success) {
    throw new EpubRequestValidationError(formatZodIssueMessage(parsed.error));
  }

  const common = normalizeCommonFields(parsed.data);
  return {
    ...common,
    selectedMediaIds: normalizeStringArray(parsed.data.selectedMediaIds),
    excludedMediaIds: normalizeStringArray(parsed.data.excludedMediaIds),
  };
}

/**
 * `POST /api/epub/demo` の未知のリクエストボディを検証・正規化します。
 */
export function parseEpubDemoRequestPayload(raw: unknown): NormalizedEpubDemoRequest {
  const parsed = EpubDemoRequestBodySchema.safeParse(raw);
  if (!parsed.success) {
    throw new EpubRequestValidationError(formatZodIssueMessage(parsed.error));
  }

  const common = normalizeCommonFields(parsed.data);
  return {
    ...common,
    items: parsed.data.items,
  };
}
