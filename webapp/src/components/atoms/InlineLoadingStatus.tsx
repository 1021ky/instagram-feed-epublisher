/**
 * @file インラインのスピナー付きステータスメッセージ (Atom)
 * 集計処理中などの軽量な非同期ステータスを aria-live="polite" で通知します。
 */
import { Loader2 } from "lucide-react";

export interface InlineLoadingStatusProps {
  /** 表示するステータスメッセージ */
  message: string;
  /** 外枠に追加するクラス名 */
  className?: string;
}

/**
 * インラインのローディングステータス表示コンポーネント。
 */
export function InlineLoadingStatus({ message, className = "pt-1" }: InlineLoadingStatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs text-slate-500 ${className}`.trim()}
    >
      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
