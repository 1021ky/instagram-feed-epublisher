/**
 * @file トグル選択可能なピル型チップボタン (Atom)
 * 選択状態（aria-pressed）とオプションの件数カウント表示を提供し、
 * モバイルでのタップ領域（44px以上）を確保します。
 */
"use client";

export interface FilterChipProps {
  /** チップに表示するメインラベル（例: "#100日チャレンジ"） */
  label: string;
  /** 補助件数（指定時は "(20)" の形式で表示） */
  count?: number;
  /** 選択状態（aria-pressed に反映） */
  selected?: boolean;
  /** 読み取り専用状態（デモモード時など cursor-not-allowed を適用） */
  readOnly?: boolean;
  /** ボタンの disabled 状態 */
  disabled?: boolean;
  /** クリック時ハンドラ */
  onClick?: () => void;
}

/**
 * トグル選択可能なピル型フィルターチップコンポーネント。
 */
export function FilterChip({
  label,
  count,
  selected = false,
  readOnly = false,
  disabled = false,
  onClick,
}: FilterChipProps) {
  const isNonInteractiveCursor = readOnly || disabled;

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition inline-flex items-center gap-1 min-h-[44px] sm:min-h-[36px] focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 ${
        isNonInteractiveCursor ? "cursor-not-allowed" : "cursor-pointer"
      } ${
        selected
          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 hover:border-slate-300"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span className={`text-[11px] ${selected ? "text-slate-300" : "text-slate-500"}`}>
          ({count})
        </span>
      )}
    </button>
  );
}
