/**
 * @file メインページコンポーネント
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { InAppBrowserAlert } from "@/components/auth/InAppBrowserAlert";
import { LoginCard } from "@/components/auth/LoginCard";
import { Navbar } from "@/components/auth/Navbar";
import {
  type EpubRequest,
  fetchInstagramFeed,
  requestEpub,
  type FeedFilter,
  type InstagramMedia,
} from "@/lib/client/instagram";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import { applyFeedFilter } from "@/lib/instagram/filter-service";
import type { AppMode, UserProfile } from "@/types/ui";

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
  const [hashtag, setHashtag] = useState("");
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [maxCount, setMaxCount] = useState(defaultMaxCount);
  const [title, setTitle] = useState("私のInstagramフィード");
  const [author, setAuthor] = useState("");
  const [contact, setContact] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [feed, setFeed] = useState<InstagramMedia[]>([]);
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
    setHashtag("");
    setStartDate(defaultDates.start);
    setEndDate(defaultDates.end);
    setMaxCount(defaultMaxCount);
    setTitle("私のInstagramフィード");
    setAuthor("");
    setContact("");
    setInstagramUrl("");
    setFeed([]);
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
  };

  const buildFilter = (): FeedFilter => ({
    hashtag: hashtag ? hashtag.replace(/^#/, "") : undefined,
    startDate,
    endDate,
    maxCount,
  });

  const buildEpubRequest = (items?: InstagramMedia[]): EpubRequest => ({
    demoMode: isDemoMode,
    filter: buildFilter(),
    metadata: {
      title,
      author,
      contact,
      instagramUrl,
    },
    items,
  });

  const handleDemo = () => {
    const demoStartDate = sampleDemoFeedData.posts[0]?.timestamp.slice(0, 10) ?? defaultDates.start;
    const demoEndDate = sampleDemoFeedData.posts.at(-1)?.timestamp.slice(0, 10) ?? defaultDates.end;
    setAppMode("demo");
    setError(null);
    setHashtag("100日チャレンジ");
    setStartDate(demoStartDate);
    setEndDate(demoEndDate);
    setMaxCount(100);
    setTitle("100日チャレンジの記録");
    setAuthor(`@${sampleDemoFeedData.username}`);
    setInstagramUrl(`https://www.instagram.com/${sampleDemoFeedData.username}/`);
    setFeed(sampleDemoFeedData.posts);
    scrollToSection("feed-results");
  };

  const handleFetch = async () => {
    if (!canUseApp) {
      setError("先にログインしてください");
      return;
    }
    setLoadingFeed(true);
    setError(null);
    try {
      const items = isDemoMode
        ? applyFeedFilter(sampleDemoFeedData.posts, buildFilter())
        : await fetchInstagramFeed(buildFilter());
      setFeed(items);
      if (items.length === 0) {
        setError(
          "フィードが取得できませんでした。指定した条件に該当する投稿がないか、アカウントに投稿がありません。",
        );
      }
      scrollToSection("feed-results");
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
    setLoadingEpub(true);
    setError(null);
    try {
      const demoItems =
        isDemoMode && feed.length === 0
          ? applyFeedFilter(sampleDemoFeedData.posts, buildFilter())
          : undefined;
      let itemsForEpub: InstagramMedia[] | undefined;
      if (isDemoMode) {
        itemsForEpub = feed.length > 0 ? feed : demoItems;
      }
      const epubBlob = await requestEpub(buildEpubRequest(itemsForEpub));
      const url = window.URL.createObjectURL(epubBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "instagram-feed.epub";
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
    <div className="page">
      <InAppBrowserAlert />
      <Navbar
        user={activeProfile}
        isDemoMode={isDemoMode}
        onLogout={canUseApp ? handleLogout : undefined}
        disabled={loadingLogin || loadingFeed || loadingEpub}
      />
      <header className="hero">
        <div className="badge bg-zinc-100 text-zinc-800">Prototype</div>
        <p className="eyebrow">Instagramフィード → EPUB</p>
        <h1>100日チャレンジの投稿を、読み返しやすい EPUB に</h1>
        <p className="lede">
          ハッシュタグや期間で絞り込み、表紙つきの EPUB をまとめて生成。Meta
          ログイン前でもデモ投稿で体験できます。
        </p>
        {canUseApp && (
          <p className="status">{isDemoMode ? "デモデータで体験中" : "Instagram にログイン済み"}</p>
        )}
        {error && <p className="error text-rose-500">{error}</p>}
      </header>

      <main className="panel">
        {!canUseApp && (
          <LoginCard loadingLogin={loadingLogin} onLogin={handleLogin} onDemo={handleDemo} />
        )}

        {canUseApp && (
          <section className="card" id="filters">
            <div className="card__header">
              <span className="tag">フィルタ</span>
              <h2>フィード条件</h2>
              <p>AND条件でハッシュタグ・期間・最大件数を指定</p>
            </div>
            <div className="grid">
              <label className="field">
                <span>ハッシュタグ（1件）</span>
                <input
                  type="text"
                  placeholder="#travel"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                />
              </label>
              <label className="field">
                <span>開始日</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="field">
                <span>終了日</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
              <label className="field">
                <span>最大取得件数（1-500）</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={maxCount}
                  onChange={(e) => setMaxCount(Number(e.target.value))}
                />
              </label>
            </div>
          </section>
        )}

        {canUseApp && (
          <section className="card">
            <div className="card__header">
              <span className="tag">メタデータ</span>
              <h2>本の情報</h2>
              <p>EPUBに埋め込むタイトル・著者情報を入力</p>
            </div>
            <div className="grid">
              <label className="field">
                <span>本のタイトル</span>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
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
          </section>
        )}

        {canUseApp && (
          <section className="card">
            <div className="card__header">
              <span className="tag">アクション</span>
              <h2>フィード取得 → EPUB生成</h2>
              <p>
                {isDemoMode
                  ? "デモデータを再絞り込みして、そのまま EPUB 生成まで試せます。"
                  : "ログイン後にフィード取得・EPUB生成が利用できます。"}
              </p>
            </div>
            <div className="actions">
              <button className="primary" onClick={handleFetch} disabled={loadingFeed}>
                {loadingFeed ? "取得中..." : "フィードを取得"}
              </button>
              <button className="ghost" onClick={handleGenerate} disabled={loadingEpub}>
                {loadingEpub ? "生成中..." : "EPUBを生成してダウンロード"}
              </button>
            </div>

            {feed.length > 0 && (
              <div className="feed" id="feed-results">
                {feed.map((item) => (
                  <article key={item.id} className="feed__item">
                    <img src={item.media_url} alt={item.caption ?? ""} loading="lazy" />
                    <div className="feed__body">
                      <p className="feed__caption">{item.caption ?? "(キャプションなし)"}</p>
                      <a href={item.permalink} target="_blank" rel="noreferrer">
                        Instagramで見る
                      </a>
                      <small>{new Date(item.timestamp).toLocaleString()}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer pb-safe">
        <small>Better Auth + Instagram Graph API + html-to-epub + Playwright</small>
      </footer>
    </div>
  );
}
