/**
 * @file Step 2 の投稿確認・選択リストとして、選択件数表示・キャプション検索・一括選択/解除・並び順切替・未取得/空状態およびカード一覧を描画する。
 */
"use client";

import { useId, useMemo, useState } from "react";
import {
  ArrowUpDown,
  CheckSquare,
  FileQuestion,
  Image as ImageIcon,
  Search,
  Square,
  X,
} from "lucide-react";
import { IconButton } from "@/components/atoms";
import { SegmentedControl, StepCardHeader } from "@/components/molecules";
import type { EpubSortOrder, FeedPostItem } from "@/types/ui";
import { toPostCardViewModel } from "../model/post-presenter";
import {
  countSelectedPosts,
  FEED_SORT_ORDER_OPTIONS,
  filterPostsByCaptionQuery,
} from "../model/selection";
import { PostCard } from "./PostCard";

/**
 * Step 2 投稿確認・選択リストコンポーネントの Props。
 */
export interface PostListStepProps {
  /** 投稿アイテム一覧 */
  posts: FeedPostItem[];
  /** 単一投稿の選択トグルコールバック */
  onToggleSelect: (postId: string) => void;
  /** カルーセル子画像の選択トグルコールバック */
  onToggleChildSelect?: (postId: string, childId: string) => void;
  /** 全選択コールバック */
  onSelectAll: () => void;
  /** 全解除コールバック */
  onDeselectAll: () => void;
  /** 投稿の並び順（デフォルト: asc = 古い順） */
  sortOrder?: EpubSortOrder;
  /** 並び順変更コールバック */
  onSortOrderChange?: (sortOrder: EpubSortOrder) => void;
  /** タイトルまたは説明文（オプショナル） */
  title?: string;
  /** サブタイトル（オプショナル） */
  subtitle?: string;
  /** フィード取得済みかどうか（false の場合は未取得の案内を表示） */
  isFetched?: boolean;
}

/**
 * Step 2: 投稿確認・選択リスト（キーワード検索・一括選択・並び順切替・カード一覧）を描画するコンポーネント。
 */
export function PostListStep({
  posts,
  onToggleSelect,
  onToggleChildSelect,
  onSelectAll,
  onDeselectAll,
  sortOrder = "asc",
  onSortOrderChange,
  title = "Step 2: 投稿の確認・選択",
  subtitle = "書籍に収録したい投稿を選択してください（除外したい投稿はタップしてチェックを外せます）",
  isFetched = true,
}: PostListStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputId = useId();

  const selectedCount = useMemo(() => countSelectedPosts(posts), [posts]);

  const filteredPostViewModels = useMemo(() => {
    return filterPostsByCaptionQuery(posts, searchQuery).map(toPostCardViewModel);
  }, [posts, searchQuery]);

  if (!isFetched && posts.length === 0) {
    return (
      <section className="w-full" aria-label="投稿確認・選択リスト">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 transition-all">
          <StepCardHeader
            stepNumber={2}
            title={title}
            description="書籍に収録したい投稿の確認と選択（Step 1 の取得後に操作可能）"
            rightSlot={
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/80">
                未取得
              </span>
            }
          />

          <div className="py-8 px-4 text-center my-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-400">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-slate-700 m-0">
                投稿はまだ取得されていません
              </p>
              <p className="text-xs text-slate-500 m-0 max-w-sm">
                Step 1
                で条件を指定して「この条件で投稿を取得」を押すと、ここに投稿一覧が表示されます。
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isAllSelected = posts.length > 0 && selectedCount === posts.length;
  const isNoneSelected = selectedCount === 0;

  return (
    <section className="w-full space-y-4" aria-label="投稿確認・選択リスト">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <StepCardHeader
          stepNumber={2}
          title={title}
          description={subtitle}
          divider={false}
          rightSlot={
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isNoneSelected
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-slate-100 text-slate-800 border border-slate-200"
              }`}
            >
              選択中: {selectedCount} / {posts.length} 件
            </span>
          }
        />

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
            className="w-full pl-10 pr-12 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition min-h-[44px]"
          />
          {searchQuery && (
            <IconButton
              aria-label="検索キーワードをクリア"
              icon={<X className="w-4 h-4" aria-hidden="true" />}
              onClick={() => setSearchQuery("")}
              className="absolute right-0.5 top-1/2 -translate-y-1/2"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              disabled={isAllSelected || posts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <CheckSquare className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>すべて選択</span>
            </button>

            <button
              type="button"
              onClick={onDeselectAll}
              disabled={isNoneSelected || posts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Square className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>選択解除</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery && (
              <span className="text-xs text-slate-500 font-medium">
                該当: {filteredPostViewModels.length} 件
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>並び順:</span>
              </span>
              <SegmentedControl
                ariaLabel="投稿の並び順"
                options={FEED_SORT_ORDER_OPTIONS}
                value={sortOrder}
                onChange={(nextSortOrder) => onSortOrderChange?.(nextSortOrder)}
              />
            </div>
          </div>
        </div>
      </div>

      {filteredPostViewModels.length > 0 ? (
        <div className="space-y-3 pb-28 sm:pb-32" role="list">
          {filteredPostViewModels.map((postVm, idx) => (
            <PostCard
              key={postVm.id}
              post={postVm}
              onToggleSelect={onToggleSelect}
              onToggleChildSelect={onToggleChildSelect}
              index={idx + 1}
            />
          ))}
        </div>
      ) : (
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
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl min-h-[44px] cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              検索キーワードをクリア
            </button>
          )}
        </div>
      )}
    </section>
  );
}
