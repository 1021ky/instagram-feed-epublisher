/**
 * @file Step 2: 投稿確認・選択リストコンポーネント (PostListStep)
 * スマホに最適化された縦1列のカードリスト、キーワード検索によるキャプション絞り込み、
 * 「すべて選択」「選択解除」の一括トグル、および選択件数カウンターを提供します。
 */
"use client";

import { useId, useMemo, useState } from "react";
import { CheckSquare, FileQuestion, Search, Square, X } from "lucide-react";
import type { FeedPostItem } from "@/types/ui";
import { PostCard } from "./PostCard";

export interface PostListStepProps {
  /** 投稿アイテム一覧 */
  posts: FeedPostItem[];
  /** 単一投稿の選択トグルコールバック */
  onToggleSelect: (postId: string) => void;
  /** 全選択コールバック */
  onSelectAll: () => void;
  /** 全解除コールバック */
  onDeselectAll: () => void;
  /** タイトルまたは説明文（オプショナル） */
  title?: string;
  /** サブタイトル（オプショナル） */
  subtitle?: string;
}

/**
 * 投稿確認・選択リストコンポーネント。
 */
export function PostListStep({
  posts,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  title = "Step 2: 投稿の確認・選択",
  subtitle = "書籍に収録したい投稿を選択してください（除外したい投稿はタップしてチェックを外せます）",
}: PostListStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputId = useId();

  // 選択件数の集計
  const selectedCount = useMemo(() => {
    return posts.filter((p) => p.selected !== false).length;
  }, [posts]);

  // キーワードによるリアルタイムフィルタリング
  const filteredPosts = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return posts;

    return posts.filter((post) => {
      const caption = (post.caption || "").toLowerCase();
      return caption.includes(trimmed);
    });
  }, [posts, searchQuery]);

  const isAllSelected = posts.length > 0 && selectedCount === posts.length;
  const isNoneSelected = selectedCount === 0;

  return (
    <section className="w-full space-y-4" aria-label="投稿確認・選択リスト">
      {/* 1. ステップヘッダー & コントロールバー */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
              2
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 m-0">{title}</h2>
              <p className="text-xs text-slate-500 m-0">{subtitle}</p>
            </div>
          </div>

          {/* 選択件数バッジ */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isNoneSelected
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-slate-100 text-slate-800 border border-slate-200"
              }`}
            >
              選択中: {selectedCount} / {posts.length} 件
            </span>
          </div>
        </div>

        {/* 2. キーワード検索バー */}
        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            キャプション内キーワード検索
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            type="text"
            placeholder="キャプション内をキーワード検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg min-h-[32px] cursor-pointer"
              aria-label="検索キーワードをクリア"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* 3. 一括操作ボタン */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              disabled={isAllSelected || posts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <CheckSquare className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>すべて選択</span>
            </button>

            <button
              type="button"
              onClick={onDeselectAll}
              disabled={isNoneSelected || posts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Square className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>選択解除</span>
            </button>
          </div>

          {searchQuery && (
            <span className="text-xs text-slate-500 font-medium">
              該当: {filteredPosts.length} 件
            </span>
          )}
        </div>
      </div>

      {/* 4. 投稿一覧リスト */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-3 pb-28 sm:pb-32" role="list">
          {filteredPosts.map((post, idx) => (
            <PostCard key={post.id} post={post} onToggleSelect={onToggleSelect} index={idx + 1} />
          ))}
        </div>
      ) : (
        /* 空状態（Empty State） */
        <div className="w-full py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileQuestion className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {posts.length === 0 ? "投稿が見つかりませんでした" : "該当する投稿がありません"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {posts.length === 0
                ? "指定した絞り込み条件に一致する投稿がないか、アカウントに投稿がありません。Step 1 の条件を変更してお試しください。"
                : `「${searchQuery}」に一致するキャプションの投稿がありません。キーワードを変更するかクリアしてください。`}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl min-h-[44px] cursor-pointer transition"
            >
              検索キーワードをクリア
            </button>
          )}
        </div>
      )}
    </section>
  );
}
