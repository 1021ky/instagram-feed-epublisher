/**
 * @file 未ログイン時のトップ画面に Instagram ログイン・デモ体験ボタンと利用手順ガイドを備えた導入カードを描画する。
 */
"use client";

import { ActionButton, InstagramBrandIcon } from "@/components/atoms";
import { LoginStepsGuide } from "./LoginStepsGuide";

/**
 * ログインカードが受け取るプロパティ。
 */
export type LoginCardProps = {
  loadingLogin: boolean;
  onDemo: () => void;
  onLogin: () => void;
};

/**
 * 未ログイン時のトップ画面に表示する Instagram ログイン・デモ体験導線カード。
 */
export function LoginCard({ loadingLogin, onDemo, onLogin }: LoginCardProps) {
  return (
    <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/80 max-w-xl mx-auto">
      <div className="mb-6 sm:mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-2xs"
              aria-hidden="true"
            >
              <InstagramBrandIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              FeedsToBook
            </span>
            <span className="hidden sm:inline text-slate-300 font-normal">|</span>
          </div>

          <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight leading-snug m-0">
            あなたらしさが詰まった日々の投稿を、「本」という作品に
          </h1>
        </div>

        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed m-0">
          100日チャレンジやイラスト連載といった作品投稿や、日々のライフログを電子書籍に。
          <br className="hidden sm:inline" />
          お使いの端末の電子書籍リーダー（KindleやApple Booksなど）でいつでも読めます。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 w-full">
        <ActionButton
          variant="gradient"
          fullWidth
          isLoading={loadingLogin}
          onClick={onLogin}
          className="rounded-lg font-medium px-5"
        >
          <InstagramBrandIcon className="w-4 h-4" />
          <span>{loadingLogin ? "移動中..." : "Instagramでログイン"}</span>
        </ActionButton>

        <ActionButton
          variant="secondary"
          fullWidth
          onClick={onDemo}
          className="rounded-lg font-medium gap-1.5 text-slate-600"
        >
          <span>デモを体験する</span>
          <span className="text-[11px] text-slate-400 font-normal">(登録不要)</span>
        </ActionButton>
      </div>

      <LoginStepsGuide />
    </section>
  );
}
