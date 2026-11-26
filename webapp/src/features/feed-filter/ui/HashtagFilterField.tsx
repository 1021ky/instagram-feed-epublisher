"use client";

import { useId } from "react";
import { Hash } from "lucide-react";
import type { HashtagSuggestion } from "@/types/ui";
import { stripLeadingHash } from "../model/hashtag";
import { HashtagQuickSelect } from "./HashtagQuickSelect";

/**
 * ハッシュタグ絞り込み入力セクションの Props。
 */
export interface HashtagFilterFieldProps {
  /** 現在のハッシュタグ入力値 */
  hashtag?: string;
  /** ハッシュタグ変更コールバック */
  onHashtagChange: (nextHashtag: string | undefined) => void;
  /** 直近投稿から集計されたハッシュタグ候補一覧 */
  suggestions: HashtagSuggestion[];
  /** ハッシュタグ候補の読み込み中フラグ */
  isLoadingSuggestions: boolean;
  /** デモ体験モードフラグ（readOnly 制御・操作ブロック通知） */
  isDemoMode: boolean;
  /** デモモード時の操作ブロック通知コールバック */
  onDemoBlocked: () => void;
}

/**
 * ハッシュタグ入力欄・datalist 補完候補・クイック選択チップ群をまとめたフィールドコンポーネント。
 */
export function HashtagFilterField({
  hashtag,
  onHashtagChange,
  suggestions,
  isLoadingSuggestions,
  isDemoMode,
  onDemoBlocked,
}: HashtagFilterFieldProps) {
  const hashtagId = useId();

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={hashtagId}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"
      >
        <Hash className="w-4 h-4 text-slate-500" aria-hidden="true" />
        <span>ハッシュタグ絞り込み</span>
        <span className="text-xs font-normal text-slate-400">（任意）</span>
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
          #
        </span>
        <input
          id={hashtagId}
          type="text"
          list="hashtag-suggestions"
          placeholder="100日チャレンジ"
          value={hashtag ? stripLeadingHash(hashtag) : ""}
          readOnly={isDemoMode}
          onClick={isDemoMode ? onDemoBlocked : undefined}
          onFocus={isDemoMode ? onDemoBlocked : undefined}
          onChange={(e) => {
            if (isDemoMode) {
              onDemoBlocked();
              return;
            }
            const cleaned = stripLeadingHash(e.target.value);
            onHashtagChange(cleaned || undefined);
          }}
          className={`w-full pl-8 pr-4 py-2.5 text-sm rounded-xl outline-none transition min-h-[44px] ${
            isDemoMode
              ? "bg-slate-100/70 border border-slate-200 text-slate-600 cursor-not-allowed select-none"
              : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          }`}
        />
        <datalist id="hashtag-suggestions">
          {suggestions.map((item) => (
            <option key={item.tag} value={item.tag} label={`#${item.tag} (${item.count}件)`} />
          ))}
        </datalist>
      </div>

      <HashtagQuickSelect
        suggestions={suggestions}
        selectedHashtag={hashtag}
        isLoading={isLoadingSuggestions}
        isDemoMode={isDemoMode}
        onDemoBlocked={onDemoBlocked}
        onSelectTag={onHashtagChange}
      />

      <p className="text-[11px] text-slate-400 m-0">
        ご自身のアカウントでつけたハッシュタグを入力してください（未入力の場合は全投稿が対象になります）。
      </p>
    </div>
  );
}
