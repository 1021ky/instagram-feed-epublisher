/**
 * @file 4種のコンテキストバリアントと44pxタップ領域・focus-visible を備えた汎用アクションボタン (Atom)
 */
"use client";

import type * as React from "react";

export type ActionButtonVariant = "primary" | "gradient" | "secondary" | "danger";

export interface ActionButtonProps {
  /** ボタン内コンテンツ */
  children: React.ReactNode;
  /** 視覚バリアント（過剰抽象化を避けるため4種に限定） */
  variant?: ActionButtonVariant;
  /** 横幅いっぱいに広げるか */
  fullWidth?: boolean;
  /** ローディング中状態（aria-busy と disabled を同時付与） */
  isLoading?: boolean;
  /** ボタン種別 */
  type?: "button" | "submit" | "reset";
  /** 無効化状態 */
  disabled?: boolean;
  /** クリック時ハンドラ */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** 明示的なアクセシビリティラベル（任意） */
  "aria-label"?: string;
  /** 呼び出し側での配置・余白調整用クラス */
  className?: string;
}

const VARIANT_CLASSES: Record<ActionButtonVariant, string> = {
  primary:
    "text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-200 disabled:text-slate-400 shadow-xs focus-visible:ring-slate-900",
  gradient:
    "text-white bg-gradient-to-r from-[#405DE6] via-[#C13584] to-[#E1306C] hover:opacity-95 disabled:opacity-50 shadow-xs focus-visible:ring-pink-500",
  secondary:
    "text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 bg-white disabled:opacity-50 focus-visible:ring-slate-400",
  danger:
    "text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60 shadow-xs focus-visible:ring-rose-500",
};

/**
 * 主要アクション向けの統一ボタンコンポーネント。
 */
export function ActionButton({
  children,
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  type = "button",
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
  className = "",
}: ActionButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      aria-busy={isLoading ? true : undefined}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold min-h-[44px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        fullWidth ? "w-full" : ""
      } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} ${
        VARIANT_CLASSES[variant]
      } ${className}`.trim()}
    >
      {children}
    </button>
  );
}
