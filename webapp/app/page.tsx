/**
 * @file メインページコンポーネント
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { InAppBrowserAlert } from "@/components/auth/InAppBrowserAlert";
import { LoginCard } from "@/components/auth/LoginCard";
import { Navbar } from "@/components/auth/Navbar";
import { FeedFilterStep, PostListStep, StickyActionBar } from "@/components/feed";
import { fetchInstagramFeed, requestEpub } from "@/lib/client/instagram";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import type { AppMode, FeedFilterOptions, FeedPostItem, UserProfile } from "@/types/ui";

const defaultMaxCount = 100;

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

  const [title, setTitle] = useState("私のInstagramフィード");
  const [author, setAuthor] = useState("");
  const [contact, setContact] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [feed, setFeed] = useState<FeedPostItem[]>([]);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingEpub, setLoadingEpub] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<AppMode>("real");

  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data);
  const isDemoMode = appMode === "demo";
  const canUseApp = isLoggedIn || isDemoMode;

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

  const scrollToSection = useCallback((id: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const resetDemoState = useCallback(() => {
    setAppMode("real");
    setFilter({
      hashtag: "",
      startDate: defaultDates.start,
      endDate: defaultDates.end,
      maxCount: defaultMaxCount,
    });
    setTitle("私のInstagramフィード");
    setAuthor("");
    setContact("");
    setInstagramUrl("");
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
    setTitle("100日チャレンジの記録");
    setAuthor(`@${sampleDemoFeedData.username}`);
    setInstagramUrl(`https://www.instagram.com/${sampleDemoFeedData.username}/`);

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

    setLoadingEpub(true);
    setError(null);
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
      };

      const epubBlob = await requestEpub({
        demoMode: isDemoMode,
        filter: cleanFilter,
        metadata: {
          title,
          author,
          contact,
          instagramUrl,
        },
        items: isDemoMode ? itemsForEpub : undefined,
      });

      const url = window.URL.createObjectURL(epubBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = isDemoMode ? "instagram-feed-demo.epub" : "instagram-feed.epub";
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "EPUB生成に失敗しました");
    } finally {
      setLoadingEpub(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("scroll") === "filters") {
      scrollToSection("filters");
    }
  }, [scrollToSection]);

  return (
    <div className={`page ${feed.length > 0 ? "pb-28 sm:pb-32" : ""}`}>
      <InAppBrowserAlert />
      <Navbar
        user={activeProfile}
        isDemoMode={isDemoMode}
        onLogout={canUseApp ? handleLogout : undefined}
        disabled={loadingLogin || loadingFeed || loadingEpub}
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
                disabled={loadingEpub}
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

            {/* 本の設定・メタデータ */}
            <section className="card" id="book-settings">
              <div className="card__header">
                <span className="tag">本の設定</span>
                <h2>本の設定・情報</h2>
                <p>EPUBに埋め込むタイトル・著者情報を入力し、電子書籍を生成します</p>
              </div>
              <div className="grid">
                <label className="field">
                  <span>本のタイトル</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="私のInstagramフィード"
                  />
                </label>
                <label className="field">
                  <span>著者名</span>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>連絡先（メールなど）</span>
                  <input
                    type="text"
                    placeholder="you@example.com"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Instagram URL</span>
                  <input
                    type="url"
                    placeholder="https://instagram.com/your_account"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                  />
                </label>
              </div>

              <div className="actions pt-4">
                <button
                  type="button"
                  className="primary"
                  onClick={handleGenerate}
                  disabled={loadingEpub || (feed.length > 0 && selectedPosts.length === 0)}
                >
                  {loadingEpub
                    ? "EPUB生成中..."
                    : `EPUBを生成してダウンロード (${selectedPosts.length}件収録)`}
                </button>
              </div>
            </section>

            {/* 画面下部固定アクションバー */}
            {feed.length > 0 && (
              <StickyActionBar
                selectedCount={selectedPosts.length}
                totalCount={feed.length}
                onNext={() => scrollToSection("book-settings")}
                nextLabel="本の設定に進む"
                disabled={loadingEpub || selectedPosts.length === 0}
              />
            )}
          </>
        )}
      </main>

      <footer className="footer pb-safe">
        <small>© FeedsToBook</small>
      </footer>
    </div>
  );
}
