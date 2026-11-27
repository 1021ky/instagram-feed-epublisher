/**
 * @file EPUB の初期設定・デモ設定・ユーザー名補完、および生成 API 向けリクエストペイロードとダウンロードファイル名を組み立てる。
 */
import type { EpubRequest, FeedFilter } from "@/lib/client/instagram";
import { sortItemsByTimestamp } from "@/lib/epub/sort";
import type { EpubCustomSettings, ExportProgress, FeedPostItem } from "@/types/ui";

/** ユーザー名未設定時に使用する書籍タイトルの既定値 */
export const DEFAULT_BOOK_TITLE = "私のInstagramフィード";

/** EPUB エクスポート進捗状態の初期値 */
export const INITIAL_EXPORT_PROGRESS: ExportProgress = {
  status: "idle",
  progress: 0,
  message: "",
};

/**
 * EPUB 生成リクエストのペイロード組み立てに必要な入力パラメータ。
 */
export interface BuildEpubExportPayloadInput {
  /** デモ体験モードで生成するか */
  isDemoMode: boolean;
  /** 正規化済みのフィード絞り込み条件 */
  filter: FeedFilter;
  /** ユーザーが入力した装丁・メタデータ設定 */
  settings: EpubCustomSettings;
  /** EPUB 収録対象として選択されている投稿一覧 */
  selectedPosts: FeedPostItem[];
}

/**
 * 初期状態の EPUB 装丁設定を生成する。
 */
export function createInitialEpubSettings(): EpubCustomSettings {
  return {
    title: DEFAULT_BOOK_TITLE,
    subtitle: "",
    author: "",
    coverTheme: "navy",
    sortOrder: "asc",
    contact: "",
    instagramUrl: "",
  };
}

/**
 * デモ体験モード開始時に適用する EPUB 装丁設定を生成する。
 */
export function createDemoEpubSettings(demoUsername: string): EpubCustomSettings {
  return {
    title: "100日チャレンジの記録",
    subtitle: "100日チャレンジの振り返り",
    author: `@${demoUsername}`,
    contact: "",
    instagramUrl: `https://www.instagram.com/${demoUsername}/`,
    coverTheme: "navy",
    sortOrder: "asc",
  };
}

/**
 * ユーザー名に応じた推奨書籍タイトルを解決する。
 */
export function resolveRecommendedBookTitle(username: string): string {
  return username ? `@${username}の投稿記録` : DEFAULT_BOOK_TITLE;
}

/**
 * 取得したユーザー名を未入力の著者名・Instagram URL および既定タイトルへ補完する。
 * 変更がない場合は不要な再描画を避けるため元のオブジェクト参照をそのまま返す。
 */
export function applyUsernameDefaultsToSettings(
  current: EpubCustomSettings,
  username: string,
): EpubCustomSettings {
  const recommendedTitle = resolveRecommendedBookTitle(username);
  const nextAuthor = current.author || (username ? `@${username}` : "");
  const nextInstagramUrl =
    current.instagramUrl || (username ? `https://instagram.com/${username}` : "");
  const nextTitle = current.title === DEFAULT_BOOK_TITLE ? recommendedTitle : current.title;

  if (
    nextAuthor === current.author &&
    nextInstagramUrl === current.instagramUrl &&
    nextTitle === current.title
  ) {
    return current;
  }

  return {
    ...current,
    title: nextTitle,
    author: nextAuthor,
    instagramUrl: nextInstagramUrl,
  };
}

/**
 * 動作モードに応じた EPUB ダウンロードファイル名を返す。
 */
export function resolveExportFilename(isDemoMode: boolean): string {
  return isDemoMode ? "instagram-feed-demo.epub" : "instagram-feed.epub";
}

/**
 * 選択済み投稿と装丁設定から EPUB 生成 API 用のリクエストペイロードを組み立てる。
 */
export function buildEpubExportPayload({
  isDemoMode,
  filter,
  settings,
  selectedPosts,
}: BuildEpubExportPayloadInput): EpubRequest {
  const itemsForEpub = selectedPosts.map((post) => ({
    id: post.id,
    media_type: post.media_type,
    media_url: post.media_url,
    thumbnail_url: post.thumbnail_url,
    children: post.children,
    permalink: post.permalink,
    caption: post.caption,
    timestamp: post.timestamp,
  }));

  const selectedCarouselChildren: Record<string, string[]> = {};
  for (const post of selectedPosts) {
    if (post.selectedChildIds !== undefined) {
      selectedCarouselChildren[post.id] = post.selectedChildIds;
    }
  }
  const hasCarouselSelections = Object.keys(selectedCarouselChildren).length > 0;

  const sortedItemsForEpub = isDemoMode
    ? sortItemsByTimestamp(itemsForEpub, settings.sortOrder)
    : undefined;

  return {
    demoMode: isDemoMode,
    filter,
    metadata: {
      title: settings.title.trim(),
      subtitle: settings.subtitle,
      author: settings.author,
      contact: settings.contact ?? "",
      instagramUrl: settings.instagramUrl ?? "",
      coverTheme: settings.coverTheme,
    },
    coverTheme: settings.coverTheme,
    sortOrder: settings.sortOrder,
    selectedMediaIds: itemsForEpub.map((item) => item.id),
    ...(hasCarouselSelections ? { selectedCarouselChildren } : {}),
    items: sortedItemsForEpub,
  };
}
