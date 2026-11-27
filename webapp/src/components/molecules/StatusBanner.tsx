/**
 * @file トーン別のアイコン・補助アクションスロット・閉じるボタンを備えたインラインのステータス通知バナーを描画する。
 */
"use client";

import type * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { IconButton, type IconButtonVariant } from "@/components/atoms";

export type StatusBannerTone = "info" | "success" | "warning";

export interface StatusBannerProps {
  /** バナーの見出しテキスト */
  title: string;
  /** 補足説明テキスト */
  description?: string;
  /** 通知トーン（デフォルト: "info"） */
  tone?: StatusBannerTone;
  /** 右側に表示する補助アクション要素（再表示ボタン等） */
  action?: React.ReactNode;
  /** 閉じるボタン押下時のハンドラ */
  onDismiss?: () => void;
  /** 閉じるボタンのアクセシビリティラベル */
  dismissLabel?: string;
  /** 外枠に追加するクラス名 */
  className?: string;
}

const TONE_STYLES: Record<
  StatusBannerTone,
  {
    container: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    dismissVariant: IconButtonVariant;
  }
> = {
  info: {
    container: "bg-sky-50 border-sky-200 text-sky-950",
    title: "text-sky-950",
    description: "text-sky-800",
    icon: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" aria-hidden="true" />,
    dismissVariant: "sky",
  },
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-950",
    title: "text-emerald-950",
    description: "text-emerald-800",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />,
    dismissVariant: "emerald",
  },
  warning: {
    container: "bg-amber-50 border-amber-300 text-amber-950",
    title: "text-amber-950",
    description: "text-amber-800",
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />,
    dismissVariant: "amber",
  },
};

export function StatusBanner({
  title,
  description,
  tone = "info",
  action,
  onDismiss,
  dismissLabel = "通知を閉じる",
  className = "",
}: StatusBannerProps) {
  const style = TONE_STYLES[tone];

  return (
    <div
      role="status"
      className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3 ${style.container} ${className}`.trim()}
    >
      {style.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold m-0 ${style.title}`}>{title}</p>
        {description && (
          <p className={`text-xs mt-1 leading-relaxed m-0 ${style.description}`}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <IconButton
          aria-label={dismissLabel}
          icon={<X className="w-4 h-4" aria-hidden="true" />}
          variant={style.dismissVariant}
          onClick={onDismiss}
          className="-mr-1.5"
        />
      )}
    </div>
  );
}
