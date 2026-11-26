/**
 * @file 44px以上のタップ領域とWAI-ARIAを備えた汎用チェックボックスボタン (Atom)
 */
"use client";

import type React from "react";
import { Check } from "lucide-react";

export interface SelectionCheckboxProps {
  /** チェック状態 */
  checked: boolean;
  /** スクリーンリーダー向け操作ラベル */
  label: string;
  /** トグル時のコールバック */
  onToggle: () => void;
  /** HTML id 属性（任意） */
  id?: string;
}

/**
 * カード内やリスト項目内で使う汎用チェックボックスボタン。
 * 親要素のクリックイベントと競合しないよう stopPropagation を内包します。
 */
export function SelectionCheckbox({ checked, label, onToggle, id }: SelectionCheckboxProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggle();
  };

  return (
    <div className="shrink-0 pt-0.5">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={handleClick}
        className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition border ${
            checked
              ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
              : "bg-white border-slate-300 text-transparent group-hover:border-slate-400"
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
        </div>
      </button>
    </div>
  );
}
