/**
 * @file EPUB 装丁設定ステップ UI
 */
import * as React from "react";
import { CoverThemeSelector } from "@/components/epub/CoverThemeSelector";
import type { EpubCustomSettings } from "@/types/ui";

type EpubCustomizeStepProps = {
  settings: EpubCustomSettings;
  onChange: (settings: EpubCustomSettings) => void;
  defaultTitle: string;
};

/**
 * EPUB 書き出し向けの Step 3 装丁設定フォームを表示する。
 */
export function EpubCustomizeStep({ settings, onChange, defaultTitle }: EpubCustomizeStepProps) {
  const update = <Key extends keyof EpubCustomSettings>(
    key: Key,
    value: EpubCustomSettings[Key],
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
          3
        </span>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 m-0">
            Step 3: EPUBの装丁を整える
          </h2>
          <p className="text-xs text-slate-500 m-0">
            タイトル・並び順・表紙テーマを設定して、読みやすい1冊に仕上げます
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          <span>書籍タイトル</span>
          <input
            type="text"
            placeholder={defaultTitle}
            value={settings.title}
            onChange={(event) => update("title", event.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition min-h-[44px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          <span>サブタイトル</span>
          <input
            type="text"
            placeholder="100日チャレンジの振り返り"
            value={settings.subtitle ?? ""}
            onChange={(event) => update("subtitle", event.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition min-h-[44px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          <span>著者名</span>
          <input
            type="text"
            placeholder="@your_account"
            value={settings.author}
            onChange={(event) => update("author", event.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition min-h-[44px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          <span>連絡先（メールなど）</span>
          <input
            type="text"
            placeholder="you@example.com"
            value={settings.contact ?? ""}
            onChange={(event) => update("contact", event.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition min-h-[44px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
          <span>Instagram URL</span>
          <input
            type="url"
            placeholder="https://instagram.com/your_account"
            value={settings.instagramUrl ?? ""}
            onChange={(event) => update("instagramUrl", event.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition min-h-[44px]"
          />
        </label>
      </div>

      <div className="space-y-5 pt-2">
        <fieldset className="space-y-2 border-0 p-0 m-0">
          <legend className="text-xs font-semibold text-slate-700 mb-2">掲載順序</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                settings.sortOrder === "asc"
                  ? "bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs"
                  : "bg-slate-50/80 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="sortOrder"
                value="asc"
                checked={settings.sortOrder === "asc"}
                onChange={() => update("sortOrder", "asc")}
                className="mt-1 accent-slate-900"
              />
              <div>
                <strong className="text-xs sm:text-sm font-bold text-slate-800 block">
                  古い順（Day 1 → 100 推奨）
                </strong>
                <small className="text-[11px] text-slate-500 mt-0.5 block leading-normal">
                  日々の積み重ねを時系列で読み返しやすい並びです。
                </small>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                settings.sortOrder === "desc"
                  ? "bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs"
                  : "bg-slate-50/80 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="sortOrder"
                value="desc"
                checked={settings.sortOrder === "desc"}
                onChange={() => update("sortOrder", "desc")}
                className="mt-1 accent-slate-900"
              />
              <div>
                <strong className="text-xs sm:text-sm font-bold text-slate-800 block">
                  新しい順
                </strong>
                <small className="text-[11px] text-slate-500 mt-0.5 block leading-normal">
                  最近の投稿からすぐに読み始めたい場合に向いています。
                </small>
              </div>
            </label>
          </div>
        </fieldset>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 block">表紙テーマ</span>
          <CoverThemeSelector
            selectedTheme={settings.coverTheme}
            onChange={(themeId) => update("coverTheme", themeId)}
          />
        </div>
      </div>
    </section>
  );
}
