/**
 * @file EPUB 生成実行ボタンと書き出し完了後のモーダル再表示ステータスバナーを表示する。
 */
"use client";

import { ActionButton, InstagramBrandIcon } from "@/components/atoms";
import { StatusBanner } from "@/components/molecules";

/**
 * EPUB 生成アクションセクションコンポーネントのプロパティ。
 */
export interface EpubExportActionSectionProps {
  /** EPUB 収録対象として選択されている投稿件数 */
  selectedCount: number;
  /** EPUB 生成処理中フラグ */
  isGenerating: boolean;
  /** EPUB 書き出しが完了しているか */
  isCompleted: boolean;
  /** EPUB 生成開始時のハンドラ */
  onGenerate: () => void;
  /** 完了バナーからエクスポートモーダルを再表示する際のハンドラ */
  onReopenModal: () => void;
}

/**
 * EPUB 生成ボタンおよび書き出し完了後の再表示バナーを描画する。
 */
export function EpubExportActionSection({
  selectedCount,
  isGenerating,
  isCompleted,
  onGenerate,
  onReopenModal,
}: EpubExportActionSectionProps) {
  return (
    <>
      <div className="pt-2">
        <ActionButton
          variant="gradient"
          disabled={selectedCount === 0}
          isLoading={isGenerating}
          onClick={onGenerate}
          className="w-full sm:w-auto px-6 py-3 text-sm font-medium"
        >
          <InstagramBrandIcon className="w-4 h-4" />
          <span>
            {isGenerating ? "EPUB生成中..." : `EPUBを生成してダウンロード (${selectedCount}件収録)`}
          </span>
        </ActionButton>
      </div>

      {isCompleted && (
        <StatusBanner
          tone="success"
          title="EPUBの書き出しが完了しました"
          action={
            <button
              type="button"
              className="text-emerald-700 font-semibold underline text-sm hover:text-emerald-900 cursor-pointer whitespace-nowrap min-h-[44px] px-1 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 rounded"
              onClick={onReopenModal}
            >
              転送ガイド・ダウンロードを再表示
            </button>
          }
        />
      )}
    </>
  );
}
