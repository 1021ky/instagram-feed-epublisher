"use client";

type LoginCardProps = {
  loadingLogin: boolean;
  onDemo: () => void;
  onLogin: () => void;
};

const steps = [
  {
    step: "1",
    title: "投稿をしぼり込む",
    description: "ハッシュタグや期間で対象の投稿を選択",
  },
  {
    step: "2",
    title: "表紙つきで整える",
    description: "タイトルや著者情報を入れ、読みやすい一冊に自動組版",
  },
  {
    step: "3",
    title: "端末ですぐに読書",
    description: "生成したEPUBをダウンロードして電子書籍リーダーで閲覧",
  },
];

export function LoginCard({ loadingLogin, onDemo, onLogin }: LoginCardProps) {
  return (
    <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm border border-slate-200/80 max-w-3xl mx-auto">
      {/* ヘッダー・メイン見出し（1行レイアウト） */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 mb-2.5">
          {/* ブランドロゴ（アイコン＋FeedsToBook） */}
          <div className="flex items-center gap-2">
            <div
              className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-2xs"
              aria-hidden="true"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              FeedsToBook
            </span>
            <span className="hidden sm:inline text-slate-300 font-normal">|</span>
          </div>

          {/* メイン見出し */}
          <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight leading-snug m-0">
            あなたらしさが詰まった日々の投稿を、「本」という作品に
          </h1>
        </div>

        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed m-0 sm:pl-9">
          100日チャレンジやイラスト連載といった作品投稿や、日々のライフログを電子書籍に。
          <br className="hidden sm:inline" />
          お使いの端末の電子書籍リーダー（KindleやApple Booksなど）でいつでも読めます。
        </p>
      </div>

      {/* CTAボタン群（適正サイズ・左寄せ配置） */}
      <div className="flex flex-col sm:flex-row items-center sm:justify-start gap-2.5 mb-8 sm:pl-9">
        <button
          type="button"
          onClick={onLogin}
          disabled={loadingLogin}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-white font-medium text-xs sm:text-sm bg-gradient-to-r from-[#405DE6] via-[#C13584] to-[#E1306C] hover:opacity-95 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px]"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <span>{loadingLogin ? "移動中..." : "Instagramでログイン"}</span>
        </button>
        <button
          type="button"
          onClick={onDemo}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
        >
          <span>デモを体験する</span>
          <span className="text-[11px] text-slate-400 font-normal">(登録不要)</span>
        </button>
      </div>

      {/* かんたん 3 ステップ（枠線なし、自然な余白でセパレート） */}
      <div className="pt-5 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-5">
          かんたん 3 ステップ
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map(({ description, step, title }) => (
            <div key={title} className="flex items-start gap-2.5 sm:gap-3">
              <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                {step}
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 m-0">{title}</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-normal m-0">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
