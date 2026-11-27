/**
 * @file Step 3 の EPUB 装丁・メタデータ入力フォームを表示し、必須タイトル検証・推奨タイトル補完・表紙テーマ選択を提供する。
 */
"use client";

import type * as React from "react";
import { useState } from "react";
import { StepCardHeader } from "@/components/molecules";
import { validateEpubTitle } from "@/lib/epub/epub-request.schema";
import type { EpubCustomSettings } from "@/types/ui";
import { CoverThemeSelector } from "./CoverThemeSelector";

/**
 * EPUB 装丁設定ステップコンポーネントのプロパティ。
 */
export interface EpubCustomizeStepProps {
  /** 現在の EPUB 装丁・メタデータ設定 */
  settings: EpubCustomSettings;
  /** 設定値変更時の更新ハンドラ */
  onChange: (settings: EpubCustomSettings) => void;
  /** タイトル空欄時に補完候補として提示する推奨タイトル */
  defaultTitle: string;
  /** 送信時などに未操作フィールドのバリデーションエラーを強制表示するか */
  showValidationErrors?: boolean;
  /** タイトル入力欄へフォーカス誘導するための Ref */
  titleInputRef?: React.RefObject<HTMLInputElement | null>;
}

const TITLE_INPUT_ID = "epub-book-title-input";
const TITLE_ERROR_ID = "epub-book-title-error";

/**
 * EPUB 書き出し向けの Step 3 装丁設定フォームを表示する。
 */
export function EpubCustomizeStep({
  settings,
  onChange,
  defaultTitle,
  showValidationErrors = false,
  titleInputRef,
}: EpubCustomizeStepProps) {
  const [titleTouched, setTitleTouched] = useState(false);

  const update = <Key extends keyof EpubCustomSettings>(
    key: Key,
    value: EpubCustomSettings[Key],
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const titleValidationMessage = validateEpubTitle(settings.title);
  const titleError =
    (titleTouched || showValidationErrors) && titleValidationMessage
      ? titleValidationMessage
      : null;
  const isTitleEmpty = settings.title.trim().length === 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-6">
      <StepCardHeader
        stepNumber={3}
        title="Step 3: EPUBの装丁を整える"
        description="タイトルや表紙テーマを設定して、読みやすい1冊に仕上げます"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={TITLE_INPUT_ID} className="inline-flex items-center gap-1.5">
              <span>書籍タイトル</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/70 text-[10px] font-bold">
                必須
              </span>
            </label>
            {isTitleEmpty && (
              <button
                type="button"
                onClick={() => {
                  update("title", defaultTitle);
                  setTitleTouched(false);
                }}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                推奨タイトルを入力
              </button>
            )}
          </div>
          <input
            ref={titleInputRef}
            id={TITLE_INPUT_ID}
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? TITLE_ERROR_ID : undefined}
            placeholder={defaultTitle}
            value={settings.title}
            onBlur={() => setTitleTouched(true)}
            onChange={(event) => update("title", event.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition min-h-[44px] ${
              titleError
                ? "bg-rose-50/40 border border-rose-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            }`}
          />
          {titleError && (
            <p id={TITLE_ERROR_ID} role="alert" className="text-xs font-medium text-rose-600 m-0">
              {titleError}
            </p>
          )}
        </div>
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
              ※ Step 2 の並び順（{settings.sortOrder === "desc" ? "新しい順" : "古い順"}
              ）で組版されます
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
