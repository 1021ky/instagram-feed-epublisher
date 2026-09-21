/**
 * @file メインページコンポーネント
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { InAppBrowserAlert } from "@/components/auth/InAppBrowserAlert";
import { LoginCard } from "@/components/auth/LoginCard";
import { Navbar } from "@/components/auth/Navbar";
import { FeedFilterStep, PostListStep, StickyActionBar } from "@/components/feed";
import { EpubCustomizeStep } from "@/components/epub/EpubCustomizeStep";
import { ExportModal } from "@/components/epub/ExportModal";
import { fetchInstagramFeed, requestEpub } from "@/lib/client/instagram";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import { sortItemsByTimestamp } from "@/lib/epub/sort";
import type {
  AppMode,
  EpubCustomSettings,
  ExportProgress,
  FeedFilterOptions,
  FeedPostItem,
  UserProfile,
} from "@/types/ui";

const defaultMaxCount = 100;
const defaultBookTitle = "私のInstagramフィード";

const dateISO = (d: Date) => d.toISOString().slice(0, 10);

/**
 * フィルター用のデフォルト日付範囲を算出するフック。
 */
function useDefaultDates() {
  return useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 30);
    return { start: dateISO(start), end: dateISO(today) };
  }, []);
}

/**
 * メインページコンポーネント。
 */
export default function Page() {
  const defaultDates = useDefaultDates();
  const [filter, setFilter] = useState<FeedFilterOptions>({
    hashtag: "",
    startDate: defaultDates.start,
    endDate: defaultDates.end,
    maxCount: defaultMaxCount,
  });
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  const [feed, setFeed] = useState<FeedPostItem[]>([]);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
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
  const downloadUrlRef = useRef<string | null>(null);

  const [appMode, setAppMode] = useState<AppMode>("real");

  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data);
  const isDemoMode = appMode === "demo";
  const canUseApp = isLoggedIn || isDemoMode;
  const isGeneratingEpub = exportProgress.status === "generating";

  const loggedInProfile = useMemo<UserProfile | null>(() => {
    const user = session.data?.user;
    if (!user) {
      return null;
    }
    const fallbackUsername = user.email?.endsWith("@instagram.local")
      ? user.email.replace("@instagram.local", "")
      : undefined;
    return {
      id: user.id,
      username: user.name ?? fallbackUsername,
      displayName: user.name ?? fallbackUsername,
      avatarUrl: user.image ?? undefined,
    };
  }, [session.data]);

  const activeProfile = isDemoMode
    ? {
        id: "demo-user",
        username: sampleDemoFeedData.username,
        displayName: "Demo User",
        avatarUrl: sampleDemoFeedData.avatarUrl,
      }
    : loggedInProfile;

  const username = activeProfile?.username?.replace(/^@/, "") ?? "";
  const recommendedTitle = username ? `@${username}の投稿記録` : defaultBookTitle;

  const scrollToSection = useCallback((id: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const triggerDownload = (url: string, filename = "instagram-feed.epub") => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  };

  const resetDemoState = useCallback(() => {
    setAppMode("real");
    setFilter({
      hashtag: "",
      startDate: defaultDates.start,
      endDate: defaultDates.end,
      maxCount: defaultMaxCount,
    });
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
    setIsFilterCollapsed(false);
    setError(null);
  }, [defaultDates.end, defaultDates.start]);

  const handleLogin = async () => {
    setLoadingLogin(true);
    setError(null);
    try {
      await authClient.signIn.oauth2({
        providerId: "instagram",
        callbackURL: "/?scroll=filters",
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
      setLoadingLogin(false);
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      resetDemoState();
      return;
    }
    await authClient.signOut();
    setFeed([]);
    setIsFilterCollapsed(false);
  };

  // 選択中の投稿一覧
  const selectedPosts = useMemo(() => {
    return feed.filter((item) => item.selected !== false);
  }, [feed]);

  // 単一投稿の選択トグル
  const handleToggleSelect = useCallback((postId: string) => {
    setFeed((prev) =>
      prev.map((item) =>
        item.id === postId ? { ...item, selected: item.selected === false } : item,
      ),
    );
  }, []);

  // すべて選択
  const handleSelectAll = useCallback(() => {
    setFeed((prev) => prev.map((item) => ({ ...item, selected: true })));
  }, []);

  // 選択解除
  const handleDeselectAll = useCallback(() => {
    setFeed((prev) => prev.map((item) => ({ ...item, selected: false })));
  }, []);

  const handleDemo = () => {
    const demoStartDate = sampleDemoFeedData.posts[0]?.timestamp.slice(0, 10) ?? defaultDates.start;
    const demoEndDate = sampleDemoFeedData.posts.at(-1)?.timestamp.slice(0, 10) ?? defaultDates.end;
    setAppMode("demo");
    setError(null);
    setFilter({
      hashtag: "100日チャレンジ",
      startDate: demoStartDate,
      endDate: demoEndDate,
      maxCount: 100,
    });
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
    // Step 1 を自動折りたたみ、Step 2 へスクロール
    setIsFilterCollapsed(true);
    scrollToSection("post-list");
  };

  const handleFetch = async () => {
    if (!canUseApp) {
      setError("先にログインしてください");
      return;
    }
    setLoadingFeed(true);
    setError(null);
    try {
      const cleanFilter = {
        hashtag: filter.hashtag ? filter.hashtag.replace(/^#/, "") : undefined,
        startDate: filter.startDate,
        endDate: filter.endDate,
        maxCount: filter.maxCount,
      };

      const items: FeedPostItem[] = isDemoMode
        ? applyFeedFilter(sampleDemoFeedData.posts, cleanFilter).map((item) => ({
            ...item,
            selected: true,
          }))
        : (await fetchInstagramFeed(cleanFilter)).map((item) => ({
            ...item,
            selected: true,
          }));

      setFeed(items);
      if (items.length === 0) {
        setError(
          "フィードが取得できませんでした。指定した条件に該当する投稿がないか、アカウントに投稿がありません。",
        );
      } else {
        setIsFilterCollapsed(true);
        scrollToSection("post-list");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "フィード取得に失敗しました");
    } finally {
      setLoadingFeed(false);
    }
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
        media_url: p.media_url,
        permalink: p.permalink,
        caption: p.caption,
        timestamp: p.timestamp,
      }));

      const cleanFilter = {
        hashtag: filter.hashtag ? filter.hashtag.replace(/^#/, "") : undefined,
        startDate: filter.startDate,
        endDate: filter.endDate,
        maxCount: filter.maxCount,
        sortOrder: customSettings.sortOrder,
      };

      // デモモード時は選択された並び順でソート
      const sortedItemsForEpub = isDemoMode
        ? sortItemsByTimestamp(itemsForEpub, customSettings.sortOrder)
        : undefined;

      const epubBlob = await requestEpub({
        demoMode: isDemoMode,
        filter: cleanFilter,
        metadata: {
          title: customSettings.title || recommendedTitle,
          subtitle: customSettings.subtitle,
          author: customSettings.author,
          contact: customSettings.contact ?? "",
          instagramUrl: customSettings.instagramUrl ?? "",
          coverTheme: customSettings.coverTheme,
        },
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
    if (downloadUrlRef.current) {
      window.URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setExportProgress((current) => ({
      ...current,
      downloadUrl: undefined,
    }));
  };

  return (
    <div className={`page ${feed.length > 0 ? "pb-28 sm:pb-32" : ""}`}>
      <div aria-hidden={isExportModalOpen} inert={isExportModalOpen}>
        <InAppBrowserAlert />
        <Navbar
          user={activeProfile}
          isDemoMode={isDemoMode}
          onLogout={canUseApp ? handleLogout : undefined}
          disabled={loadingLogin || loadingFeed || isGeneratingEpub}
        />
        {error && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2"
          >
            <span className="font-bold">✕</span>
            <p className="flex-1">{error}</p>
          </div>
        )}

        <main className="panel space-y-6">
          {!canUseApp && (
            <LoginCard loadingLogin={loadingLogin} onLogin={handleLogin} onDemo={handleDemo} />
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
                  onToggleCollapse={() => setIsFilterCollapsed((prev) => !prev)}
                  disabled={isGeneratingEpub}
                />
              </div>

              {/* Step 2: 投稿確認・選択リスト */}
              {feed.length > 0 && (
                <div id="post-list">
                  <PostListStep
                    posts={feed}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                </div>
              )}

              {/* Step 3: EPUB装丁・メタデータ設定 */}
              <div id="book-settings" className="space-y-4">
                <EpubCustomizeStep
                  settings={customSettings}
                  onChange={setCustomSettings}
                  defaultTitle={recommendedTitle}
                />

                <div className="actions pt-4">
                  <button
                    type="button"
                    className="primary"
                    onClick={handleGenerate}
                    disabled={isGeneratingEpub || (feed.length > 0 && selectedPosts.length === 0)}
                  >
                    {isGeneratingEpub
                      ? "EPUB生成中..."
                      : `EPUBを生成してダウンロード (${selectedPosts.length}件収録)`}
                  </button>
                </div>
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

        <footer className="footer pb-safe">
          <small>© FeedsToBook</small>
        </footer>
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
    </div>
  );
}
