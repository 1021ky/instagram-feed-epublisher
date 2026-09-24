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
            タイトルや表紙テーマを設定して、読みやすい1冊に仕上げます
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

      <div className="space-y-4 pt-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 block">表紙テーマ</span>
            <span className="text-[11px] text-slate-400">
              ※ 投稿は時系列（古い順）で自動組版されます
            </span>
          </div>
          <CoverThemeSelector
            selectedTheme={settings.coverTheme}
            onChange={(themeId) => update("coverTheme", themeId)}
          />
        </div>
      </div>
    </section>
  );
}
