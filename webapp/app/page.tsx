/**
 * @file メインページの認証・絞り込み・投稿選択・EPUB書き出し各機能スライスを統合して描画する。
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertBanner, InAppBrowserAlert } from "@/components/molecules";
import { Navbar, StickyActionBar } from "@/components/organisms";
import {
  AccountDeletionModal,
  LoginCard,
  LogoutNoticeBanner,
  useAccountDeletion,
  useAuthFlow,
} from "@/features/auth";
import {
  EpubCustomizeStep,
  EpubExportActionSection,
  ExportModal,
  useEpubExport,
} from "@/features/epub-export";
import { PostListStep, useFeedSelection } from "@/features/feed";
import { FeedFilterStep, toFeedFetchFilter, useFeedFilter } from "@/features/feed-filter";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";

/**
 * メインページコンポーネント。
 */
export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const noop = useCallback(() => {}, []);

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
    onResetDemo: noop,
    onLoggedOut: noop,
  });

  const {
    customSettings,
    setCustomSettings,
    setSortOrder,
    recommendedTitle,
    exportProgress,
    isGenerating: isGeneratingEpub,
    isModalOpen: isExportModalOpen,
    openModal: openExportModal,
    closeModal: closeExportModal,
    showValidationErrors: showCustomizeErrors,
    titleInputRef,
    applyDemoSettings,
    resetExportState,
    generateEpub,
    redownload,
  } = useEpubExport({
    username,
    isDemoMode,
    onError: setError,
  });

  const {
    feed,
    setFeed,
    clearFeed,
    sortedFeed,
    selectedPosts,
    toggleSelect,
    toggleChildSelect,
    selectAll,
    deselectAll,
  } = useFeedSelection({ sortOrder: customSettings.sortOrder });

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
    clearFeed();
    if (wasDemo) {
      resetExportState();
      resetFilter();
      setError(null);
    } else {
      resetFetchState();
    }
  }, [clearFeed, handleLogout, isDemoMode, resetExportState, resetFetchState, resetFilter]);

  const handleAccountDeleted = useCallback(() => {
    clearFeed();
    resetFetchState();
    resetExportState();
    exitDemoMode();
  }, [clearFeed, exitDemoMode, resetExportState, resetFetchState]);

  const accountDeletion = useAccountDeletion({
    onDeleted: handleAccountDeleted,
  });

  const handleDemo = useCallback(() => {
    enterDemoMode();
    setError(null);
    applyDemoFilter();
    applyDemoSettings(sampleDemoFeedData.username);
    setFeed(sampleDemoFeedData.posts.map((p) => ({ ...p, selected: true })));
  }, [applyDemoFilter, applyDemoSettings, enterDemoMode, setFeed]);

  const handleGenerate = useCallback(() => {
    void generateEpub({
      canUseApp,
      filter: toFeedFetchFilter(filter, customSettings.sortOrder),
      selectedPosts,
    });
  }, [canUseApp, customSettings.sortOrder, filter, generateEpub, selectedPosts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("scroll") === "filters") {
      scrollToSection("filters");
    }
  }, [scrollToSection]);

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
                <LogoutNoticeBanner
                  username={logoutNotice.username}
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
                  onSortOrderChange={setSortOrder}
                  isFetched={hasFetched || feed.length > 0}
                  onToggleSelect={toggleSelect}
                  onToggleChildSelect={toggleChildSelect}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
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

                <EpubExportActionSection
                  selectedCount={selectedPosts.length}
                  isGenerating={isGeneratingEpub}
                  isCompleted={exportProgress.status === "completed"}
                  onGenerate={handleGenerate}
                  onReopenModal={openExportModal}
                />
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
        onDownload={redownload}
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
