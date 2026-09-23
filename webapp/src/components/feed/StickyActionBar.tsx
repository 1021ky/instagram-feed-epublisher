/**
 * @file 画面下部固定アクションバーコンポーネント (StickyActionBar)
 * モバイル画面の最下部に常時固定され、親指の届く範囲で現在選択中の件数確認と、
 * 次のステップ（本の設定・装丁設定）へ進む主導線を提供します。
 * iOSのホームバー領域に対応（Safe Area / pb-safe）。
 */
"use client";

import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

export interface StickyActionBarProps {
  /** 現在選択中の投稿件数 */
  selectedCount: number;
  /** 合計投稿件数（オプショナル） */
  totalCount?: number;
  /** 次のステップへ進むコールバック */
  onNext: () => void;
  /** プライマリボタンのラベル（デフォルト: "本の設定に進む"） */
  nextLabel?: string;
  /** 前のステップに戻るコールバック（オプショナル） */
  onBack?: () => void;
  /** 戻るボタンのラベル（デフォルト: "戻る"） */
  backLabel?: string;
  /** ボタンの無効化フラグ（指定なし時は selectedCount === 0 で無効化） */
  disabled?: boolean;
}

/**
 * 画面下部固定アクションバーコンポーネント。
 */
export function StickyActionBar({
  selectedCount,
  totalCount,
  onNext,
  nextLabel = "本の設定に進む",
  onBack,
  backLabel = "戻る",
  disabled,
}: StickyActionBarProps) {
  // 0件選択時は次へ進めない
  const isNextDisabled = disabled ?? selectedCount === 0;

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 py-3 pb-safe transition-all"
      aria-label="操作アクションバー"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        {/* 戻るボタン（存在する場合） */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition min-h-[44px] cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label={backLabel}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden xs:inline">{backLabel}</span>
          </button>
        )}

        {/* 選択件数ステータス表示 */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              収録対象
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {typeof totalCount === "number" ? (
                <>
                  <span className="text-blue-600 text-sm sm:text-base font-extrabold">
                    {selectedCount}
                  </span>
                  <span className="text-slate-400 font-normal text-xs sm:text-sm">
                    {" "}
                    / {totalCount} 件
                  </span>
                </>
              ) : (
                <>
                  選択中:{" "}
                  <span className="text-blue-600 font-extrabold text-sm sm:text-base">
                    {selectedCount}
                  </span>{" "}
                  件
                </>
              )}
            </p>
          </div>
        </div>

        {/* 次へ進むアクションボタン（44x44px 以上のタップ領域） */}
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm transition min-h-[48px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={`${nextLabel} (選択中 ${selectedCount} 件)`}
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
