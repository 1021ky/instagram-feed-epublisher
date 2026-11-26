/**
 * @file Step 1〜3 で共有するステップカード共通ヘッダー
 */
import type * as React from "react";

export interface StepCardHeaderProps {
  /** ステップ番号（1, 2, 3 等） */
  stepNumber: number;
  /** ステップ見出し */
  title: string;
  /** 補足説明文 */
  description?: string;
  /** 右側に配置する任意要素（折りたたみボタン、件数バッジ等） */
  rightSlot?: React.ReactNode;
  /** 下部区切り線を表示するか（デフォルト: true） */
  divider?: boolean;
  /** 外枠に追加するクラス名 */
  className?: string;
}

export function StepCardHeader({
  stepNumber,
  title,
  description,
  rightSlot,
  divider = true,
  className = "",
}: StepCardHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        divider ? "pb-4 border-b border-slate-100" : ""
      } ${className}`.trim()}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
          {stepNumber}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 m-0">{title}</h2>
          {description && <p className="text-xs text-slate-500 m-0">{description}</p>}
        </div>
      </div>

      {rightSlot && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">{rightSlot}</div>
      )}
    </div>
  );
}
