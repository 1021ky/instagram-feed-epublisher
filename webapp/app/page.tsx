/**
 * @file メインページコンポーネント
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertBanner, InAppBrowserAlert, StatusBanner } from "@/components/molecules";
import { EpubCustomizeStep, ExportModal, Navbar, StickyActionBar } from "@/components/organisms";
import {
  AccountDeletionModal,
  formatLogoutBannerTitle,
  LoginCard,
  useAccountDeletion,
  useAuthFlow,
} from "@/features/auth";
import { PostListStep } from "@/features/feed";
import { FeedFilterStep, toFeedFetchFilter, useFeedFilter } from "@/features/feed-filter";
import { requestEpub } from "@/lib/client/instagram";
import { validateEpubTitle } from "@/lib/epub/epub-request.schema";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import { listCarouselMediaEntries } from "@/lib/instagram/media-resolver";
import { sortItemsByTimestamp } from "@/lib/epub/sort";
import type { EpubCustomSettings, ExportProgress, FeedPostItem } from "@/types/ui";

const defaultBookTitle = "私のInstagramフィード";

/**
 * メインページコンポーネント。
 */
export default function Page() {
  const [feed, setFeed] = useState<FeedPostItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [customSettings, setCustomSettings] = useState<EpubCustomSettings>({
    title: defaultBookTitle,
    subtitle: "",
    author: "",
    coverTheme: "navy",
    sortOrder: "asc",
    contact: "",
    instagramUrl: "",
  });
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showCustomizeErrors, setShowCustomizeErrors] = useState(false);
  const downloadUrlRef = useRef<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const isGeneratingEpub = exportProgress.status === "generating";

  const clearFeedPosts = useCallback(() => {
    setFeed([]);
  }, []);

  const resetDemoNonFilterState = useCallback(() => {
    setCustomSettings({
      title: defaultBookTitle,
      subtitle: "",
      author: "",
      coverTheme: "navy",
      sortOrder: "asc",
      contact: "",
      instagramUrl: "",
    });
    setFeed([]);
    setShowCustomizeErrors(false);
    setError(null);
  }, []);

  const {
    isLoggedIn,
    isSessionPending,
    isDemoMode,
    canUseApp,
    loadingLogin,
    activeProfile,
    username,
    logoutNotice,
    dismissLogoutNotice,
    enterDemoMode,
    exitDemoMode,
    handleLogin,
    handleLogout,
  } = useAuthFlow({
    onError: setError,
    onResetDemo: resetDemoNonFilterState,
    onLoggedOut: clearFeedPosts,
  });

  const scrollToSection = useCallback((id: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleFetchSuccess = useCallback(() => {
    scrollToSection("post-list");
  }, [scrollToSection]);

  const {
    filter,
    setFilter,
    isFilterCollapsed,
    toggleFilterCollapsed,
    hashtagSuggestions,
    isLoadingHashtags,
    loadingFeed,
    hasFetched,
    handleFetch,
    applyDemoFilter,
    resetFetchState,
    resetFilter,
  } = useFeedFilter({
    isLoggedIn,
    isDemoMode,
    canUseApp,
    sortOrder: customSettings.sortOrder,
    onError: setError,
    onFeedFetched: setFeed,
    onFetchSuccess: handleFetchSuccess,
  });

  const handleLogoutClick = useCallback(async () => {
    const wasDemo = isDemoMode;
    await handleLogout();
    if (wasDemo) {
      resetFilter();
    } else {
      resetFetchState();
    }
  }, [handleLogout, isDemoMode, resetFetchState, resetFilter]);

  const handleAccountDeleted = useCallback(() => {
    setFeed([]);
    resetFetchState();
    exitDemoMode();
  }, [exitDemoMode, resetFetchState]);

  const accountDeletion = useAccountDeletion({
    onDeleted: handleAccountDeleted,
  });

  const recommendedTitle = username ? `@${username}の投稿記録` : defaultBookTitle;

  const triggerDownload = (url: string, filename = "instagram-feed.epub") => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  // Step 2 の並び順設定に応じた表示用フィード（デフォルト: 古い順 asc）
  const sortedFeed = useMemo(() => {
    return sortItemsByTimestamp(feed, customSettings.sortOrder);
  }, [feed, customSettings.sortOrder]);

  // 選択中の投稿一覧
  const selectedPosts = useMemo(() => {
    return sortedFeed.filter((item) => item.selected !== false);
  }, [sortedFeed]);

  // 単一投稿の選択トグル
  const handleToggleSelect = useCallback((postId: string) => {
    setFeed((prev) =>
      prev.map((item) => {
        if (item.id !== postId) {
          return item;
        }
        const nextSelected = item.selected === false;
        return {
          ...item,
          selected: nextSelected,
          selectedChildIds:
            nextSelected && item.selectedChildIds?.length === 0 ? undefined : item.selectedChildIds,
        };
      }),
    );
  }, []);

  // カルーセル投稿内の個別写真選択トグル
  const handleToggleChildSelect = useCallback((postId: string, childId: string) => {
    setFeed((prev) =>
      prev.map((item) => {
        if (item.id !== postId) {
          return item;
        }
        const allIds = listCarouselMediaEntries(item).map((entry) => entry.id);
        if (allIds.length === 0) {
          return item;
        }
        const currentIds =
          item.selected === false && item.selectedChildIds === undefined
            ? []
            : (item.selectedChildIds ?? allIds);
        const currentSet = new Set(currentIds);
        if (currentSet.has(childId)) {
          currentSet.delete(childId);
        } else {
          currentSet.add(childId);
        }
        const nextIds = allIds.filter((id) => currentSet.has(id));
        if (nextIds.length === 0) {
          return { ...item, selected: false, selectedChildIds: [] };
        }
        return {
          ...item,
          selected: true,
          selectedChildIds: nextIds.length === allIds.length ? undefined : nextIds,
        };
      }),
    );
  }, []);

  // すべて選択
  const handleSelectAll = useCallback(() => {
    setFeed((prev) =>
      prev.map((item) => ({
        ...item,
        selected: true,
        selectedChildIds: item.selectedChildIds?.length === 0 ? undefined : item.selectedChildIds,
      })),
    );
  }, []);

  // 選択解除
  const handleDeselectAll = useCallback(() => {
    setFeed((prev) => prev.map((item) => ({ ...item, selected: false })));
  }, []);

  const handleDemo = () => {
    enterDemoMode();
    setError(null);
    applyDemoFilter();
    setCustomSettings({
      title: "100日チャレンジの記録",
      subtitle: "100日チャレンジの振り返り",
      author: `@${sampleDemoFeedData.username}`,
      contact: "",
      instagramUrl: `https://www.instagram.com/${sampleDemoFeedData.username}/`,
      coverTheme: "navy",
      sortOrder: "asc",
    });

    // デモ投稿を初期全選択状態でセット
    setFeed(sampleDemoFeedData.posts.map((p) => ({ ...p, selected: true })));
  };

  const handleGenerate = async () => {
    if (!canUseApp) {
      setError("先にログインしてください");
      return;
    }
    if (selectedPosts.length === 0) {
      setError("収録する投稿が1件も選択されていません。投稿を選択してください。");
      return;
    }
    const titleError = validateEpubTitle(customSettings.title);
    if (titleError) {
      setShowCustomizeErrors(true);
      setError(titleError);
      titleInputRef.current?.focus();
      return;
    }
    setShowCustomizeErrors(false);
    setError(null);
    setIsExportModalOpen(true);
    if (downloadUrlRef.current) {
      window.URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setExportProgress({
      status: "generating",
      progress: 20,
      message: "投稿を並び替えてEPUBを生成しています…",
    });
    try {
      // EPUB生成対象の投稿（選択されたもののみ）
      const itemsForEpub = selectedPosts.map((p) => ({
        id: p.id,
        media_type: p.media_type,
        media_url: p.media_url,
        thumbnail_url: p.thumbnail_url,
        children: p.children,
        permalink: p.permalink,
        caption: p.caption,
        timestamp: p.timestamp,
      }));

      const selectedCarouselChildren: Record<string, string[]> = {};
      for (const post of selectedPosts) {
        if (post.selectedChildIds !== undefined) {
          selectedCarouselChildren[post.id] = post.selectedChildIds;
        }
      }
      const hasCarouselSelections = Object.keys(selectedCarouselChildren).length > 0;

      const cleanFilter = toFeedFetchFilter(filter, customSettings.sortOrder);

      // デモモード時は選択された並び順でソート
      const sortedItemsForEpub = isDemoMode
        ? sortItemsByTimestamp(itemsForEpub, customSettings.sortOrder)
        : undefined;

      const epubBlob = await requestEpub({
        demoMode: isDemoMode,
        filter: cleanFilter,
        metadata: {
          title: customSettings.title.trim(),
          subtitle: customSettings.subtitle,
          author: customSettings.author,
          contact: customSettings.contact ?? "",
          instagramUrl: customSettings.instagramUrl ?? "",
          coverTheme: customSettings.coverTheme,
        },
        coverTheme: customSettings.coverTheme,
        sortOrder: customSettings.sortOrder,
        selectedMediaIds: itemsForEpub.map((item) => item.id),
        ...(hasCarouselSelections ? { selectedCarouselChildren } : {}),
        items: sortedItemsForEpub,
      });

      setExportProgress({
        status: "generating",
        progress: 80,
        message: "EPUBを書き出しました。ダウンロードを開始しています…",
      });
      const url = window.URL.createObjectURL(epubBlob);
      downloadUrlRef.current = url;
      const downloadFilename = isDemoMode ? "instagram-feed-demo.epub" : "instagram-feed.epub";
      triggerDownload(url, downloadFilename);
      setExportProgress({
        status: "completed",
        progress: 100,
        message: "ダウンロードが始まりました。端末への転送方法も確認できます。",
        downloadUrl: url,
      });
      setIsExportModalOpen(true);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "EPUB生成に失敗しました";
      setError(message);
      setExportProgress({
        status: "error",
        progress: 0,
        message: "EPUBの生成に失敗しました。",
        error: message,
      });
      setIsExportModalOpen(true);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("scroll") === "filters") {
      scrollToSection("filters");
    }
  }, [scrollToSection]);

  useEffect(() => {
    setCustomSettings((current) => {
      const nextAuthor = current.author || (username ? `@${username}` : "");
      const nextInstagramUrl =
        current.instagramUrl || (username ? `https://instagram.com/${username}` : "");
      const nextTitle = current.title === defaultBookTitle ? recommendedTitle : current.title;

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
    });
  }, [recommendedTitle, username]);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        window.URL.revokeObjectURL(downloadUrlRef.current);
      }
    };
  }, []);

  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  return (
    <div className={`page ${feed.length > 0 ? "pb-28 sm:pb-32" : ""}`}>
      <div
        aria-hidden={isExportModalOpen || accountDeletion.isOpen}
        inert={isExportModalOpen || accountDeletion.isOpen}
        className="max-w-3xl mx-auto w-full"
      >
        <InAppBrowserAlert />
        <Navbar
          user={activeProfile}
          isDemoMode={isDemoMode}
          onLogout={canUseApp ? handleLogoutClick : undefined}
          onDeleteAccount={!isDemoMode && isLoggedIn ? accountDeletion.openModal : undefined}
          disabled={loadingLogin || loadingFeed || isGeneratingEpub || accountDeletion.isDeleting}
        />
        {error && <AlertBanner message={error} className="mb-4" />}

        <main className="max-w-3xl mx-auto w-full space-y-6">
          {!canUseApp && !isSessionPending && (
            <>
              {logoutNotice && (
                <StatusBanner
                  className="max-w-xl mx-auto"
                  title={formatLogoutBannerTitle(logoutNotice.username)}
                  onDismiss={dismissLogoutNotice}
                />
              )}
              <LoginCard loadingLogin={loadingLogin} onLogin={handleLogin} onDemo={handleDemo} />
            </>
          )}

          {canUseApp && (
            <>
              {/* Step 1: フィード絞り込みフォーム */}
              <div id="filters">
                <FeedFilterStep
                  filter={filter}
                  onFilterChange={setFilter}
                  onSubmit={handleFetch}
                  isLoading={loadingFeed}
                  error={error}
                  fetchedCount={feed.length > 0 ? feed.length : undefined}
                  isCollapsed={isFilterCollapsed}
                  onToggleCollapse={toggleFilterCollapsed}
                  disabled={isGeneratingEpub}
                  isDemoMode={isDemoMode}
                  hashtagSuggestions={hashtagSuggestions}
                  isLoadingHashtags={isLoadingHashtags}
                />
              </div>

              {/* Step 2: 投稿確認・選択リスト */}
              <div id="post-list">
                <PostListStep
                  posts={sortedFeed}
                  sortOrder={customSettings.sortOrder}
                  onSortOrderChange={(sortOrder) =>
                    setCustomSettings((prev) => ({ ...prev, sortOrder }))
                  }
                  isFetched={hasFetched || feed.length > 0}
                  onToggleSelect={handleToggleSelect}
                  onToggleChildSelect={handleToggleChildSelect}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />
              </div>

              {/* Step 3: EPUB装丁・メタデータ設定 */}
              <div id="book-settings" className="space-y-4">
                <EpubCustomizeStep
                  settings={customSettings}
                  onChange={setCustomSettings}
                  defaultTitle={recommendedTitle}
                  showValidationErrors={showCustomizeErrors}
                  titleInputRef={titleInputRef}
                />

                <div className="pt-2">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-[#405DE6] via-[#C13584] to-[#E1306C] hover:opacity-95 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
                    onClick={handleGenerate}
                    disabled={isGeneratingEpub || selectedPosts.length === 0}
                  >
                    <svg
                      className="w-4 h-4 fill-current shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>
                      {isGeneratingEpub
                        ? "EPUB生成中..."
                        : `EPUBを生成してダウンロード (${selectedPosts.length}件収録)`}
                    </span>
                  </button>
                </div>

                {exportProgress.status === "completed" && (
                  <div
                    role="status"
                    className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600">✓</span>
                      <span>EPUBの書き出しが完了しました</span>
                    </div>
                    <button
                      type="button"
                      className="text-emerald-700 font-semibold underline text-sm hover:text-emerald-900 cursor-pointer whitespace-nowrap"
                      onClick={() => setIsExportModalOpen(true)}
                    >
                      転送ガイド・ダウンロードを再表示
                    </button>
                  </div>
                )}
              </div>

              {/* 画面下部固定アクションバー */}
              {feed.length > 0 && (
                <StickyActionBar
                  selectedCount={selectedPosts.length}
                  totalCount={feed.length}
                  onNext={() => scrollToSection("book-settings")}
                  nextLabel="本の設定に進む"
                  disabled={isGeneratingEpub || selectedPosts.length === 0}
                />
              )}
            </>
          )}
        </main>
      </div>

      <ExportModal
        progress={exportProgress}
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        onDownload={() => {
          if (downloadUrlRef.current) {
            const downloadFilename = isDemoMode
              ? "instagram-feed-demo.epub"
              : "instagram-feed.epub";
            triggerDownload(downloadUrlRef.current, downloadFilename);
          }
        }}
      />

      <AccountDeletionModal
        isOpen={accountDeletion.isOpen}
        step={accountDeletion.step}
        isDeleting={accountDeletion.isDeleting}
        error={accountDeletion.error}
        onConfirm={accountDeletion.confirmDelete}
        onClose={accountDeletion.closeModal}
        onCompleteClose={accountDeletion.completeClose}
      />
    </div>
  );
}
