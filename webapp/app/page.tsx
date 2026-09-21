/**
 * @file メインページコンポーネント
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import {
  fetchInstagramFeed,
  requestEpub,
  type FeedFilter,
  type InstagramMedia,
} from "@/lib/client/instagram";
import { LogOut } from "lucide-react";

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

  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data);

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
    await authClient.signOut();
    setFeed([]);
  };

  const buildFilter = (): FeedFilter => ({
    hashtag: hashtag ? hashtag.replace(/^#/, "") : undefined,
    startDate,
    endDate,
    maxCount,
  });

  const handleFetch = async () => {
    if (!isLoggedIn) {
      setError("先にログインしてください");
      return;
    }
    setLoadingFeed(true);
    setError(null);
    try {
      const items = await fetchInstagramFeed(buildFilter());
      setFeed(items);
      if (items.length === 0) {
        setError(
          "フィードが取得できませんでした。指定した条件に該当する投稿がないか、アカウントに投稿がありません。",
        );
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "フィード取得に失敗しました");
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setError("先にログインしてください");
      return;
    }
    setLoadingEpub(true);
    setError(null);
    try {
      const epubBlob = await requestEpub({
        filter: buildFilter(),
        metadata: {
          title,
          author,
          contact,
          instagramUrl,
        },
      });
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
      const anchor = document.getElementById("filters");
      anchor?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="page">
      <header className="hero relative">
        {/* ログイン時: 右上に小さくスマートなログアウトボタンを配置 */}
        {isLoggedIn && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 border border-slate-200/80 bg-white/60 backdrop-blur-xs transition cursor-pointer min-h-[36px] shadow-2xs"
              aria-label="ログアウト"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ログアウト</span>
            </button>
          </div>
        )}

        <p className="eyebrow font-semibold text-blue-600">Instagram Feeds to E-Book</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          FeedsToBook
        </h1>
        <p className="text-sm font-semibold text-slate-700 mt-1">
          流れるフィードを、ずっと手元に残る一冊に。
        </p>
        <p className="lede text-slate-600 max-w-xl">
          日々の投稿や100日チャレンジをまとめて、Kindleや電子書籍リーダーで読める本に仕立てます。
        </p>

        {/* 未ログイン時のみ、ログインCTAボタンを表示 */}
        {!isLoggedIn && (
          <div className="actions pt-2">
            <button className="primary" onClick={handleLogin} disabled={loadingLogin}>
              {loadingLogin ? "移動中..." : "Instagramでログイン"}
            </button>
          </div>
        )}

        {error && <p className="error text-rose-500 mt-2">{error}</p>}
      </header>

      <main className="panel">
        {!isLoggedIn && (
          <section className="card">
            <div className="card__header">
              <span className="tag">ログイン</span>
              <h2>続行するにはログインが必要です</h2>
              <p>Instagramでログイン後にフィード条件とEPUB生成が利用できます。</p>
            </div>
          </section>
        )}

        {isLoggedIn && (
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

        {isLoggedIn && (
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

        {isLoggedIn && (
          <section className="card">
            <div className="card__header">
              <span className="tag">アクション</span>
              <h2>フィード取得 → EPUB生成</h2>
              <p>ログイン後にフィード取得・EPUB生成が利用できます。</p>
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
              <div className="feed">
                {feed.map((item) => (
                  <article key={item.id} className="feed__item">
                    <Image
                      src={item.media_url}
                      alt={item.caption ?? ""}
                      width={500}
                      height={500}
                      style={{ objectFit: "cover" }}
                    />
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
        <small>© FeedsToBook</small>
      </footer>
    </div>
  );
}
