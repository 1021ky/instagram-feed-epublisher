/**
 * @file 閉じるボタン・クリアボタン等に用いる汎用アイコンボタン
 */
"use client";

import type * as React from "react";

export type IconButtonVariant = "neutral" | "sky" | "amber" | "emerald";
export type IconButtonShape = "rounded" | "circle";

export interface IconButtonProps {
  /** スクリーンリーダー向け操作ラベル */
  "aria-label": string;
  /** 表示する装飾アイコン要素（読み上げは aria-label で代替） */
  icon: React.ReactNode;
  /** クリック時ハンドラ */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** コンテキストに応じたカラーバリアント */
  variant?: IconButtonVariant;
  /** ボタンの角丸形状 */
  shape?: IconButtonShape;
  /** 無効化状態 */
  disabled?: boolean;
  /** ボタン種別 */
  type?: "button" | "submit" | "reset";
  /** 呼び出し側での配置・余白調整用クラス */
  className?: string;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  neutral: "text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400",
  sky: "text-sky-700 hover:text-sky-950 hover:bg-sky-100 focus-visible:ring-sky-500",
  amber: "text-amber-700 hover:text-amber-950 hover:bg-amber-100 focus-visible:ring-amber-500",
  emerald:
    "text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 focus-visible:ring-emerald-500",
};

const SHAPE_CLASSES: Record<IconButtonShape, string> = {
  rounded: "rounded-lg",
  circle: "rounded-full",
};

export function IconButton({
  "aria-label": ariaLabel,
  icon,
  onClick,
  variant = "neutral",
  shape = "rounded",
  disabled = false,
  type = "button",
  className = "",
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center flex-shrink-0 transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${SHAPE_CLASSES[shape]} ${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      {icon}
    </button>
  );
}
