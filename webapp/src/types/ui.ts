/**
 * @file UI共通型定義
 * ステップ管理、フィード絞り込み条件、投稿選択、EPUB装丁設定、表紙テーマ、デモデータ等の型を提供します。
 */

/**
 * ウィザードのステップ番号（1: 絞り込み, 2: 投稿選択, 3: 装丁設定）。
 */
export type StepNumber = 1 | 2 | 3;

/**
 * ウィザードのステップ識別子。
 */
export type StepId = "filter" | "select" | "customize";

/**
 * アプリケーションの動作モード。
 * - `real`: Instagram SSO で認証し、実際の Graph API からフィードを取得。
 * - `demo`: ログイン不要で、あらかじめ用意されたサンプルデータを使用して体験。
 */
export type AppMode = "real" | "demo";

/**
 * 期間指定プリセットオプション。
 */
export type DatePreset = "100days" | "30days" | "all" | "custom";

/**
 * フィード絞り込みフォームの入力条件。
 */
export interface FeedFilterOptions {
  /** 絞り込み対象のハッシュタグ（'#' の有無は問わない） */
  hashtag?: string;
  /** 開始日（YYYY-MM-DD 形式） */
  startDate?: string;
  /** 終了日（YYYY-MM-DD 形式） */
  endDate?: string;
  /** 最大取得件数（1〜500） */
  maxCount: number;
}

/**
 * 投稿選択画面用のフィードアイテム表現。
 * ※ like_count（いいね数）はアプリ内の確認・並び替え表示専用であり、
 *   プロダクトポリシーに基づき EPUB 書籍本文には出力されません。
 */
export interface FeedPostItem {
  /** Instagram メディア ID */
  id: string;
  /** メディア（画像・動画サムネイル）の表示 URL */
  media_url: string;
  /** Instagram の投稿パーマリンク */
  permalink: string;
  /** キャプション本文 */
  caption?: string;
  /** 投稿日時（ISO 8601 形式） */
  timestamp: string;
  /** いいね数（UI表示専用、EPUBには含めない） */
  like_count?: number;
  /** コメント数（UI表示専用、EPUBには含めない） */
  comments_count?: number;
  /** EPUB への収録対象フラグ */
  selected?: boolean;
}

/**
 * EPUB 内の章（投稿）の掲載順序。
 * - `asc`: 日付の古い順（Day 1 → Day 100 等の時系列表示に推奨）。
 * - `desc`: 日付の新しい順。
 */
export type EpubSortOrder = "asc" | "desc";

/**
 * 表紙カラーテーマの識別子。
 */
export type CoverThemeId = "navy" | "slate" | "ivory" | "white" | "purple";

/**
 * 表紙カラーテーマの定義情報。
 */
export interface CoverTheme {
  /** テーマの一意識別子 */
  id: CoverThemeId;
  /** 画面表示用のテーマ名（例: "濃紺: チャレンジ"） */
  name: string;
  /** デザインコンセプトの説明 */
  description: string;
  /** 表紙全体の背景色 */
  pageBackground: string;
  /** カード部分の背景スタイル */
  cardBackground: string;
  /** 主見出しの文字色 */
  textColor: string;
  /** 補足テキストの文字色 */
  metaColor: string;
  /** アクセントライン色 */
  accentColor: string;
  /** 見出しフォント（オプショナル） */
  titleFontFamily?: string;
  /** 本文フォント（オプショナル） */
  bodyFontFamily?: string;
  /** 見出し文字間隔（オプショナル） */
  titleLetterSpacing?: string;
}

/**
 * EPUB 装丁・出力設定。
 */
export interface EpubCustomSettings {
  /** 書籍タイトル（表紙およびメタデータに設定） */
  title: string;
  /** サブタイトルまたは説明文 */
  subtitle?: string;
  /** 著者名・アカウント名 */
  author: string;
  /** 選択された表紙カラーテーマ */
  coverTheme: CoverThemeId;
  /** 投稿の並び順（昇順 / 降順） */
  sortOrder: EpubSortOrder;
  /** 連絡先（メールアドレス等） */
  contact?: string;
  /** 著者の Instagram プロフィール URL */
  instagramUrl?: string;
}

/**
 * デモ体験モード用のサンプルフィードデータ構造。
 */
export interface DemoFeedData {
  /** デモアカウントのユーザー名 */
  username: string;
  /** アバター画像の URL */
  avatarUrl: string;
  /** デモの対象ハッシュタグ（例: "#100日チャレンジ"） */
  hashtag: string;
  /** サンプル投稿リスト */
  posts: FeedPostItem[];
}

/**
 * ヘッダー等に表示するユーザープロフィール情報。
 */
export interface UserProfile {
  /** ユーザー ID */
  id: string;
  /** Instagram ユーザーネーム（'@' なし） */
  username?: string;
  /** 表示名 */
  displayName?: string;
  /** アバター画像 URL */
  avatarUrl?: string;
}

/**
 * EPUB 生成・ダウンロードの進行状態。
 */
export type ExportStatus = "idle" | "generating" | "completed" | "error";

/**
 * エクスポートモーダルの状態管理情報。
 */
export interface ExportProgress {
  /** 現在の処理ステータス */
  status: ExportStatus;
  /** 進行度（0〜100） */
  progress: number;
  /** 状態説明メッセージ */
  message: string;
  /** エラー発生時のメッセージ */
  error?: string;
  /** 生成完了した EPUB のダウンロード URL（Blob URL） */
  downloadUrl?: string;
}
