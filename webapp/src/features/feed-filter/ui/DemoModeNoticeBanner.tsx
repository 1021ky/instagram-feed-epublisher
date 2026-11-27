/**
 * @file デモ体験モード中の条件固定仕様を案内し、変更操作がブロックされた直後は警告トーンへ切り替えて表示する。
 */
"use client";

import { StatusBanner } from "@/components/molecules";

/**
 * デモ体験モード制限案内バナーの Props。
 */
export interface DemoModeNoticeBannerProps {
  /** 条件変更操作がブロックされた直後の警告状態か */
  isBlocked: boolean;
  /** 警告バナーを閉じて通常案内へ戻すハンドラ */
  onDismiss: () => void;
}

/**
 * デモ体験モード中の固定条件案内および変更ブロック警告を表示するバナーコンポーネント。
 */
export function DemoModeNoticeBanner({ isBlocked, onDismiss }: DemoModeNoticeBannerProps) {
  return (
    <StatusBanner
      className="mb-4"
      tone={isBlocked ? "warning" : "info"}
      title={
        isBlocked
          ? "デモ体験中は条件を変更できません（ログイン後に自由に変更できます）"
          : "デモ体験モード：条件は固定サンプルです（ログイン後に自由に変更できます）"
      }
      onDismiss={isBlocked ? onDismiss : undefined}
      dismissLabel="案内を閉じる"
    />
  );
}
