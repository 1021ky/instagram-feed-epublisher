/**
 * @file セグメント切替コントロール (Molecule)
 * 期間プリセットや並び順切替など、排他的オプション選択用のボタングループを提供します。
 */
"use client";

export interface SegmentedControlOption<T extends string = string> {
  /** 選択肢の値 */
  value: T;
  /** 表示ラベル */
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  /** ボタングループのアクセシビリティラベル */
  ariaLabel: string;
  /** 選択肢配列 */
  options: readonly SegmentedControlOption<T>[];
  /** 現在選択中の値（いずれにも一致しない場合は全ボタン非選択となる） */
  value: T | null | undefined;
  /** 選択変更時ハンドラ */
  onChange: (value: T) => void;
  /** 読み取り専用状態（デモモード時など、disabled にせずクリック通知を飛ばす用途） */
  readOnly?: boolean;
  /** readOnly 状態でクリックされたときのハンドラ */
  onReadOnlyClick?: () => void;
  /** ボタン群の無効化状態 */
  disabled?: boolean;
  /** 外枠に追加するクラス名 */
  className?: string;
}

/**
 * 排他的セグメント切替ボタングループコンポーネント。
 */
export function SegmentedControl<T extends string = string>({
  ariaLabel,
  options,
  value,
  onChange,
  readOnly = false,
  onReadOnlyClick,
  disabled = false,
  className = "",
}: SegmentedControlProps<T>) {
  const isNonInteractiveCursor = readOnly || disabled;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-slate-100 p-1 rounded-xl gap-1 ${className}`.trim()}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                return;
              }
              if (readOnly) {
                onReadOnlyClick?.();
                return;
              }
              onChange(option.value);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 ${
              isNonInteractiveCursor ? "cursor-not-allowed" : "cursor-pointer"
            } ${
              isSelected
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
