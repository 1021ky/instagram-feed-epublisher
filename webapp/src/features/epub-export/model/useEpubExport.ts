/**
 * @file EPUB 装丁設定の保持、ユーザー名の自動補完、生成 API 呼び出しと Blob URL ライフサイクル、エクスポートモーダル開閉を一元管理する。
 */
"use client";

import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestEpub, type FeedFilter } from "@/lib/client/instagram";
import { validateEpubTitle } from "@/lib/epub/epub-request.schema";
import type { EpubCustomSettings, EpubSortOrder, ExportProgress, FeedPostItem } from "@/types/ui";
import {
  applyUsernameDefaultsToSettings,
  buildEpubExportPayload,
  createDemoEpubSettings,
  createInitialEpubSettings,
  INITIAL_EXPORT_PROGRESS,
  resolveExportFilename,
  resolveRecommendedBookTitle,
} from "./export-payload";

/**
 * EPUB 書き出し管理フックが受け取る外部状態および連携コールバック。
 */
export interface UseEpubExportOptions {
  /** 現在アクティブなユーザー名（'@' なし） */
  username: string;
  /** デモ体験モードで動作しているか */
  isDemoMode: boolean;
  /** ページ共通エラー状態への通知コールバック */
  onError: (message: string | null) => void;
}

/**
 * EPUB 生成実行時に呼び出し側から渡す実行コンテキスト。
 */
export interface GenerateEpubParams {
  /** アプリ本体を利用可能か（ログイン済みまたはデモモード） */
  canUseApp: boolean;
  /** 正規化済みのフィード絞り込み条件 */
  filter: FeedFilter;
  /** EPUB 収録対象として選択されている投稿一覧 */
  selectedPosts: FeedPostItem[];
}

/**
 * EPUB 装丁設定、生成進捗、モーダル開閉、ダウンロード・リセット操作をまとめた戻り値。
 */
export interface UseEpubExportResult {
  /** 現在の EPUB 装丁・メタデータ設定 */
  customSettings: EpubCustomSettings;
  /** 装丁設定の更新関数 */
  setCustomSettings: React.Dispatch<React.SetStateAction<EpubCustomSettings>>;
  /** 投稿の並び順のみを更新するハンドラ */
  setSortOrder: (sortOrder: EpubSortOrder) => void;
  /** 現在のユーザー名に応じた推奨書籍タイトル */
  recommendedTitle: string;
  /** EPUB 生成・書き出しの進行状態 */
  exportProgress: ExportProgress;
  /** EPUB 生成処理中フラグ */
  isGenerating: boolean;
  /** エクスポートモーダルの開閉状態 */
  isModalOpen: boolean;
  /** エクスポートモーダルを開くハンドラ */
  openModal: () => void;
  /** エクスポートモーダルを閉じるハンドラ */
  closeModal: () => void;
  /** 装丁フォームのバリデーションエラー表示フラグ */
  showValidationErrors: boolean;
  /** タイトル入力欄へフォーカス誘導するための Ref */
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  /** デモ体験モード用の装丁設定を適用するハンドラ */
  applyDemoSettings: (demoUsername: string) => void;
  /** 装丁設定・バリデーション状態・生成済みリソースを初期化するハンドラ */
  resetExportState: () => void;
  /** EPUB 生成 API 呼び出しと初回ダウンロードを実行するハンドラ */
  generateEpub: (params: GenerateEpubParams) => Promise<void>;
  /** 生成済みの Blob URL を用いて EPUB を再ダウンロードするハンドラ */
  redownload: () => void;
}

/**
 * Blob URL を使ってブラウザに EPUB ファイルをダウンロードさせる。
 */
function triggerBrowserDownload(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * EPUB 装丁設定、生成 API 実行、Blob URL 解放、エクスポートモーダル開閉を一元管理するフック。
 */
export function useEpubExport({
  username,
  isDemoMode,
  onError,
}: UseEpubExportOptions): UseEpubExportResult {
  const [customSettings, setCustomSettings] = useState<EpubCustomSettings>(() =>
    createInitialEpubSettings(),
  );
  const [exportProgress, setExportProgress] = useState<ExportProgress>(INITIAL_EXPORT_PROGRESS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const downloadUrlRef = useRef<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const recommendedTitle = resolveRecommendedBookTitle(username);
  const isGenerating = exportProgress.status === "generating";

  const revokeCurrentDownloadUrl = useCallback(() => {
    if (downloadUrlRef.current) {
      window.URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    setCustomSettings((current) => applyUsernameDefaultsToSettings(current, username));
  }, [username]);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        window.URL.revokeObjectURL(downloadUrlRef.current);
      }
    };
  }, []);

  const setSortOrder = useCallback((sortOrder: EpubSortOrder) => {
    setCustomSettings((prev) => ({ ...prev, sortOrder }));
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const applyDemoSettings = useCallback((demoUsername: string) => {
    setCustomSettings(createDemoEpubSettings(demoUsername));
    setShowValidationErrors(false);
  }, []);

  const resetExportState = useCallback(() => {
    revokeCurrentDownloadUrl();
    setCustomSettings(createInitialEpubSettings());
    setExportProgress(INITIAL_EXPORT_PROGRESS);
    setIsModalOpen(false);
    setShowValidationErrors(false);
  }, [revokeCurrentDownloadUrl]);

  const redownload = useCallback(() => {
    if (downloadUrlRef.current) {
      triggerBrowserDownload(downloadUrlRef.current, resolveExportFilename(isDemoMode));
    }
  }, [isDemoMode]);

  const generateEpub = useCallback(
    async ({ canUseApp, filter, selectedPosts }: GenerateEpubParams) => {
      if (!canUseApp) {
        onError("先にログインしてください");
        return;
      }
      if (selectedPosts.length === 0) {
        onError("収録する投稿が1件も選択されていません。投稿を選択してください。");
        return;
      }
      const titleError = validateEpubTitle(customSettings.title);
      if (titleError) {
        setShowValidationErrors(true);
        onError(titleError);
        titleInputRef.current?.focus();
        return;
      }

      setShowValidationErrors(false);
      onError(null);
      setIsModalOpen(true);
      revokeCurrentDownloadUrl();
      setExportProgress({
        status: "generating",
        progress: 20,
        message: "投稿を並び替えてEPUBを生成しています…",
      });

      try {
        const payload = buildEpubExportPayload({
          isDemoMode,
          filter,
          settings: customSettings,
          selectedPosts,
        });

        const epubBlob = await requestEpub(payload);

        setExportProgress({
          status: "generating",
          progress: 80,
          message: "EPUBを書き出しました。ダウンロードを開始しています…",
        });

        const url = window.URL.createObjectURL(epubBlob);
        downloadUrlRef.current = url;
        triggerBrowserDownload(url, resolveExportFilename(isDemoMode));

        setExportProgress({
          status: "completed",
          progress: 100,
          message: "ダウンロードが始まりました。端末への転送方法も確認できます。",
          downloadUrl: url,
        });
        setIsModalOpen(true);
      } catch (e) {
        console.error(e);
        const message = e instanceof Error ? e.message : "EPUB生成に失敗しました";
        onError(message);
        setExportProgress({
          status: "error",
          progress: 0,
          message: "EPUBの生成に失敗しました。",
          error: message,
        });
        setIsModalOpen(true);
      }
    },
    [customSettings, isDemoMode, onError, revokeCurrentDownloadUrl],
  );

  return {
    customSettings,
    setCustomSettings,
    setSortOrder,
    recommendedTitle,
    exportProgress,
    isGenerating,
    isModalOpen,
    openModal,
    closeModal,
    showValidationErrors,
    titleInputRef,
    applyDemoSettings,
    resetExportState,
    generateEpub,
    redownload,
  };
}
