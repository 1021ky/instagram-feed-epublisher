/**
 * @file 共通モーダルダイアログシェル (Molecule)
 * Escape キー・Backdrop クリック制御・ARIA 属性・任意の閉じるボタンを統一します。
 */
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/atoms";

export interface ModalDialogProps {
  /** モーダルの開閉状態 */
  isOpen: boolean;
  /** 閉じる要求時のハンドラ（closeDisabled=true のときは呼ばれない） */
  onClose: () => void;
  /** ダイアログ見出し要素の ID（aria-labelledby） */
  labelledBy: string;
  /** ダイアログ説明要素の ID（aria-describedby） */
  describedBy?: string;
  /** true の間は Escape キー・Backdrop クリック・閉じるボタンによるクローズを抑止する */
  closeDisabled?: boolean;
  /** 右上に閉じる IconButton を表示するか */
  showCloseButton?: boolean;
  /** 右上閉じるボタンのアクセシビリティラベル */
  closeButtonLabel?: string;
  /** モーダルカード本体に追加するクラス名 */
  cardClassName?: string;
  /** モーダル内部コンテンツ */
  children: React.ReactNode;
}

/**
 * 共通モーダルダイアログシェルコンポーネント。
 */
export function ModalDialog({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  closeDisabled = false,
  showCloseButton = false,
  closeButtonLabel = "モーダルを閉じる",
  cardClassName = "",
  children,
}: ModalDialogProps) {
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDisabled, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="presentation"
      onClick={closeDisabled ? undefined : onClose}
    >
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-7 w-full max-w-lg mx-auto relative my-8 ${cardClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onClick={(event) => event.stopPropagation()}
      >
        {showCloseButton && (
          <IconButton
            aria-label={closeButtonLabel}
            icon={<X className="w-5 h-5" aria-hidden="true" />}
            shape="circle"
            variant="neutral"
            disabled={closeDisabled}
            onClick={onClose}
            className="absolute top-3 right-3"
          />
        )}
        {children}
      </div>
    </div>
  );
}
