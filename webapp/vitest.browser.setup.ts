/**
 * @file Vitest Browser Mode（実ブラウザ Medium テスト）用の共通セットアップ。
 * Tailwind CSS v4 と globals.css を読み込み、実ブラウザ上でのレイアウト・タップ領域・操作を検証可能にします。
 */
import "./app/globals.css";
import "vitest-browser-react";
import { beforeEach, vi } from "vitest";

// Next.js クライアントバンドル相当の process.env 参照をブラウザテスト環境でも安全に解決する
if (typeof globalThis.process === "undefined") {
  (globalThis as unknown as { process: { env: Record<string, string> } }).process = {
    env: { NODE_ENV: "test" },
  };
}

// 異常系テスト等での想定内ログ出力によるテスト結果ノイズを抑制
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
