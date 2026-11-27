/**
 * @file フィード絞り込み条件の保持、正規化済み取得条件の算出、ハッシュタグ候補の自動取得、投稿フィード取得フローを一元管理する。
 */
"use client";

import type * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchHashtagSuggestions,
  fetchInstagramFeed,
  type FeedFilter,
} from "@/lib/client/instagram";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { extractHashtagsFromPosts } from "@/lib/instagram/hashtag-service";
import type { EpubSortOrder, FeedFilterOptions, FeedPostItem, HashtagSuggestion } from "@/types/ui";
import { createInitialFeedFilter, DEFAULT_FEED_MAX_COUNT, toFeedFetchFilter } from "./date-preset";

/**
 * フィード絞り込み・取得管理フックが受け取る外部状態および連携コールバック。
 */
export interface UseFeedFilterOptions {
  /** 実アカウントでログイン済みか */
  isLoggedIn: boolean;
  /** デモ体験モードか */
  isDemoMode: boolean;
  /** アプリ本体を利用可能か（ログイン済みまたはデモモード） */
  canUseApp: boolean;
  /** 取得リクエストに付与する投稿並び順 */
  sortOrder: EpubSortOrder;
  /** ページ共通エラー状態への通知コールバック */
  onError: (message: string | null) => void;
  /** 取得完了した投稿一覧の反映コールバック */
  onFeedFetched: (items: FeedPostItem[]) => void;
  /** 投稿を 1 件以上取得できた直後の追加処理（スクロール誘導など） */
  onFetchSuccess?: () => void;
}

/**
 * フィード絞り込み状態・ハッシュタグ候補・投稿取得アクションをまとめた戻り値。
 */
export interface UseFeedFilterResult {
  /** 現在の絞り込み条件 */
  filter: FeedFilterOptions;
  /** 現在の絞り込み条件と並び順を API・EPUB 生成向けに正規化した条件 */
  fetchFilter: FeedFilter;
  /** 絞り込み条件の更新関数 */
  setFilter: React.Dispatch<React.SetStateAction<FeedFilterOptions>>;
  /** Step 1 カードの折りたたみ状態 */
  isFilterCollapsed: boolean;
  /** 折りたたみ状態のトグルハンドラ */
  toggleFilterCollapsed: () => void;
  /** 表示対象のハッシュタグ候補一覧（デモ時はサンプル集計結果） */
  hashtagSuggestions: HashtagSuggestion[];
  /** ハッシュタグ候補の読み込み中フラグ */
  isLoadingHashtags: boolean;
  /** 投稿フィードの取得中フラグ */
  loadingFeed: boolean;
  /** 1 回以上フィード取得を実行したか */
  hasFetched: boolean;
  /** 現在の絞り込み条件で投稿一覧を取得するハンドラ */
  handleFetch: () => Promise<void>;
  /** デモモード開始時の固定条件と取得済み状態を適用するハンドラ */
  applyDemoFilter: () => void;
  /** 折りたたみ状態と取得済みフラグのみ初期化するハンドラ */
  resetFetchState: () => void;
  /** 絞り込み条件・折りたたみ状態・取得済みフラグを初期化するハンドラ */
  resetFilter: () => void;
}

/**
 * フィード絞り込み条件、ハッシュタグ候補の自動取得、投稿フィード取得フローを一元管理するフック。
 */
export function useFeedFilter({
  isLoggedIn,
  isDemoMode,
  canUseApp,
  sortOrder,
  onError,
  onFeedFetched,
  onFetchSuccess,
}: UseFeedFilterOptions): UseFeedFilterResult {
  const [filter, setFilter] = useState<FeedFilterOptions>(() => createInitialFeedFilter());
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [fetchedHashtags, setFetchedHashtags] = useState<HashtagSuggestion[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const demoHashtagSuggestions = useMemo(() => {
    if (!isDemoMode) {
      return [];
    }
    return extractHashtagsFromPosts(sampleDemoFeedData.posts, { limit: 20 });
  }, [isDemoMode]);

  useEffect(() => {
    if (!isLoggedIn || isDemoMode) {
      setFetchedHashtags([]);
      setLoadingHashtags(false);
      return;
    }

    let cancelled = false;
    setLoadingHashtags(true);

    fetchHashtagSuggestions(20)
      .then((suggestions) => {
        if (!cancelled) {
          setFetchedHashtags(suggestions);
        }
      })
      .catch((err) => {
        console.warn("ハッシュタグ候補の自動取得をスキップしました:", err);
        if (!cancelled) {
          setFetchedHashtags([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingHashtags(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isDemoMode]);

  const toggleFilterCollapsed = useCallback(() => {
    setIsFilterCollapsed((prev) => !prev);
  }, []);

  const resetFetchState = useCallback(() => {
    setIsFilterCollapsed(false);
    setHasFetched(false);
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(createInitialFeedFilter());
    setIsFilterCollapsed(false);
    setHasFetched(false);
  }, []);

  const applyDemoFilter = useCallback(() => {
    const fallback = createInitialFeedFilter();
    const demoStartDate = sampleDemoFeedData.posts[0]?.timestamp.slice(0, 10) ?? fallback.startDate;
    const demoEndDate = sampleDemoFeedData.posts.at(-1)?.timestamp.slice(0, 10) ?? fallback.endDate;

    setFilter({
      hashtag: "100日チャレンジ",
      startDate: demoStartDate,
      endDate: demoEndDate,
      maxCount: DEFAULT_FEED_MAX_COUNT,
    });
    setHasFetched(true);
    setIsFilterCollapsed(false);
  }, []);

  const fetchFilter = useMemo<FeedFilter>(
    () => toFeedFetchFilter(filter, sortOrder),
    [filter, sortOrder],
  );

  const handleFetch = useCallback(async () => {
    if (!canUseApp) {
      onError("先にログインしてください");
      return;
    }

    setLoadingFeed(true);
    onError(null);
    try {
      const items: FeedPostItem[] = isDemoMode
        ? applyFeedFilter(sampleDemoFeedData.posts, fetchFilter).map((item) => ({
            ...item,
            selected: true,
          }))
        : (await fetchInstagramFeed(fetchFilter)).map((item) => ({
            ...item,
            selected: true,
          }));

      onFeedFetched(items);
      setHasFetched(true);

      if (items.length === 0) {
        onError(
          "フィードが取得できませんでした。指定した条件に該当する投稿がないか、アカウントに投稿がありません。",
        );
      } else {
        setIsFilterCollapsed(true);
        onFetchSuccess?.();
      }
    } catch (e) {
      console.error(e);
      onError(e instanceof Error ? e.message : "フィード取得に失敗しました");
    } finally {
      setLoadingFeed(false);
    }
  }, [canUseApp, fetchFilter, isDemoMode, onError, onFeedFetched, onFetchSuccess]);

  return {
    filter,
    fetchFilter,
    setFilter,
    isFilterCollapsed,
    toggleFilterCollapsed,
    hashtagSuggestions: isDemoMode ? demoHashtagSuggestions : fetchedHashtags,
    isLoadingHashtags: !isDemoMode && loadingHashtags,
    loadingFeed,
    hasFetched,
    handleFetch,
    applyDemoFilter,
    resetFetchState,
    resetFilter,
  };
}
