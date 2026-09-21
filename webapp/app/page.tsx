/**
 * @file メインページコンポーネント
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { EpubCustomizeStep } from "@/components/epub/EpubCustomizeStep";
import { ExportModal } from "@/components/epub/ExportModal";
import { sortItemsByTimestamp } from "@/lib/epub/sort";
import {
  fetchInstagramFeed,
  requestEpub,
  type FeedFilter,
  type InstagramMedia,
} from "@/lib/client/instagram";
import type { EpubCustomSettings, ExportProgress } from "@/types/ui";

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
  const [hashtag, setHashtag] = useState("");
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [maxCount, setMaxCount] = useState(defaultMaxCount);
  const [feed, setFeed] = useState<InstagramMedia[]>([]);
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

  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data);
  const username = session.data?.user?.name?.replace(/^@/, "") ?? "";
  const recommendedTitle = username ? `@${username}の投稿記録` : defaultBookTitle;

  const sortedFeed = useMemo(
    () => sortItemsByTimestamp(feed, customSettings.sortOrder),
    [feed, customSettings.sortOrder],
  );

  const triggerDownload = (url: string) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "instagram-feed.epub";
    anchor.click();
  };

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
    sortOrder: customSettings.sortOrder,
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
      const epubBlob = await requestEpub({
        filter: buildFilter(),
        metadata: {
          title: customSettings.title || recommendedTitle,
          subtitle: customSettings.subtitle,
          author: customSettings.author,
          contact: customSettings.contact ?? "",
          instagramUrl: customSettings.instagramUrl ?? "",
          coverTheme: customSettings.coverTheme,
        },
      });
      setExportProgress({
        status: "generating",
        progress: 80,
        message: "EPUBを書き出しました。ダウンロードを開始しています…",
      });
      const url = window.URL.createObjectURL(epubBlob);
      downloadUrlRef.current = url;
      triggerDownload(url);
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
      const anchor = document.getElementById("filters");
      anchor?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

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
    <div className="page">
      <div aria-hidden={isExportModalOpen} inert={isExportModalOpen}>
        <header className="hero">
          <div className="badge bg-zinc-100 text-zinc-800">Prototype</div>
          <p className="eyebrow">Instagramフィード → EPUB</p>
          <h1>SSOでログインして電子書籍を作ろう</h1>
          <p className="lede">
            ログイン → フィード取得条件を入力 →
            EPUBをサーバで生成。タイトルや著者情報も埋め込み可能。
          </p>
          <div className="actions">
            <button className="primary" onClick={handleLogin} disabled={loadingLogin}>
              {loadingLogin ? "移動中..." : "Instagramでログイン"}
            </button>
            <button className="ghost" onClick={handleLogout} disabled={!isLoggedIn}>
              ログアウト
            </button>
          </div>
          {isLoggedIn && <p className="status">ログイン済み</p>}
          {error && <p className="error text-rose-500">{error}</p>}
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
            <EpubCustomizeStep
              settings={customSettings}
              onChange={setCustomSettings}
              defaultTitle={recommendedTitle}
            />
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
                <button
                  className="ghost"
                  onClick={handleGenerate}
                  disabled={exportProgress.status === "generating"}
                >
                  {exportProgress.status === "generating" ? "生成中..." : "EPUBをダウンロード"}
                </button>
              </div>

              {sortedFeed.length > 0 && (
                <div className="feed">
                  {sortedFeed.map((item) => (
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
          <small>Better Auth + Instagram Graph API + html-to-epub + Playwright</small>
        </footer>
      </div>

      <ExportModal
        progress={exportProgress}
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        onDownload={() => {
          if (downloadUrlRef.current) {
            triggerDownload(downloadUrlRef.current);
          }
        }}
      />
    </div>
  );
}
