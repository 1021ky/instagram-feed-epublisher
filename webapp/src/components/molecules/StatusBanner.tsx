/**
 * @file ステータス通知バナーコンポーネント (Molecule)
 * 画面上部やセクション直上に配置し、状態変化や操作後の補足案内を
 * 閉じるボタン付きで明示的に通知します。
 */
"use client";

import { Info, X } from "lucide-react";

export interface StatusBannerProps {
  /** バナーの見出しテキスト */
  title: string;
  /** 補足説明テキスト */
  description?: string;
  /** 閉じるボタン押下時のハンドラ */
  onDismiss?: () => void;
  /** 閉じるボタンのアクセシビリティラベル */
  dismissLabel?: string;
  /** 外枠に追加するクラス名 */
  className?: string;
}

/**
 * 閉じるボタン付きのインライン・ステータス通知バナーコンポーネント。
 */
export function StatusBanner({
  title,
  description,
  onDismiss,
  dismissLabel = "通知を閉じる",
  className = "",
}: StatusBannerProps) {
  return (
    <div
      role="status"
      className={`p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 shadow-xs flex items-start gap-3 ${className}`.trim()}
    >
      <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-sky-950 m-0">{title}</p>
        {description && (
          <p className="text-xs text-sky-800 mt-1 leading-relaxed m-0">{description}</p>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-mr-1.5 -mt-1.5 min-h-[44px] min-w-[44px] rounded-lg text-sky-700 hover:text-sky-950 hover:bg-sky-100 transition flex items-center justify-center flex-shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
