"use client";

import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { sortItemsByTimestamp } from "@/lib/epub/sort";
import type { EpubSortOrder, FeedPostItem } from "@/types/ui";
import {
  deselectAllPosts,
  getSelectedPosts,
  selectAllPosts,
  toggleCarouselChildSelection,
  togglePostSelection,
} from "./selection";

/**
 * フィード投稿一覧・選択状態管理フックが受け取る設定オプション。
 */
export interface UseFeedSelectionOptions {
  /** 投稿一覧の並び順（asc: 古い順、desc: 新しい順） */
  sortOrder: EpubSortOrder;
}

/**
 * フィード投稿一覧、並び替え済み・選択済み派生リスト、および選択操作アクションをまとめた戻り値。
 */
export interface UseFeedSelectionResult {
  /** 取得済みの元投稿一覧 */
  feed: FeedPostItem[];
  /** 投稿一覧の更新関数 */
  setFeed: React.Dispatch<React.SetStateAction<FeedPostItem[]>>;
  /** 投稿一覧を空配列へ初期化するハンドラ */
  clearFeed: () => void;
  /** 指定された並び順でソート済みの投稿一覧 */
  sortedFeed: FeedPostItem[];
  /** 並び替え済み一覧のうち EPUB 収録対象として選択されている投稿一覧 */
  selectedPosts: FeedPostItem[];
  /** 単一投稿の選択トグルハンドラ */
  toggleSelect: (postId: string) => void;
  /** カルーセル個別写真の選択トグルハンドラ */
  toggleChildSelect: (postId: string, childId: string) => void;
  /** すべての投稿を選択状態にするハンドラ */
  selectAll: () => void;
  /** すべての投稿を未選択状態にするハンドラ */
  deselectAll: () => void;
}

/**
 * 取得済み投稿一覧の保持、並び替え、単体・カルーセル・一括の選択状態操作を一元管理するフック。
 */
export function useFeedSelection({ sortOrder }: UseFeedSelectionOptions): UseFeedSelectionResult {
  const [feed, setFeed] = useState<FeedPostItem[]>([]);

  const clearFeed = useCallback(() => {
    setFeed([]);
  }, []);

  const sortedFeed = useMemo(() => {
    return sortItemsByTimestamp(feed, sortOrder);
  }, [feed, sortOrder]);

  const selectedPosts = useMemo(() => {
    return getSelectedPosts(sortedFeed);
  }, [sortedFeed]);

  const toggleSelect = useCallback((postId: string) => {
    setFeed((prev) => togglePostSelection(prev, postId));
  }, []);

  const toggleChildSelect = useCallback((postId: string, childId: string) => {
    setFeed((prev) => toggleCarouselChildSelection(prev, postId, childId));
  }, []);

  const selectAll = useCallback(() => {
    setFeed((prev) => selectAllPosts(prev));
  }, []);

  const deselectAll = useCallback(() => {
    setFeed((prev) => deselectAllPosts(prev));
  }, []);

  return {
    feed,
    setFeed,
    clearFeed,
    sortedFeed,
    selectedPosts,
    toggleSelect,
    toggleChildSelect,
    selectAll,
    deselectAll,
  };
}
