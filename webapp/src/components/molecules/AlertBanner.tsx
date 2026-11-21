/**
 * @file エラーアラートバナーコンポーネント (Molecule)
 * 画面上部やフォーム内で共通利用される role="alert" のエラーメッセージ表示を提供します。
 */

export interface AlertBannerProps {
  /** 表示するエラーメッセージ */
  message: string;
  /** 外枠に追加するクラス名（マージン調整用など） */
  className?: string;
}

/**
 * エラーアラートバナーコンポーネント。
 */
export function AlertBanner({ message, className = "" }: AlertBannerProps) {
  return (
    <div
      role="alert"
      className={`p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2 ${className}`.trim()}
    >
      <span className="font-bold">✕</span>
      <p className="flex-1">{message}</p>
    </div>
  );
}
