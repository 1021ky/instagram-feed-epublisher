/**
 * @file ブラウザテスト共通セットアップ（レイアウト検証用スタイル適用と環境初期化）。
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
