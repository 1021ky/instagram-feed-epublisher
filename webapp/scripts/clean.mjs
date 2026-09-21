/**
 * @file キャッシュおよびビルド生成物の削除スクリプト
 * Next.js のビルド成果物およびキャッシュディレクトリ（.next）を安全に削除します。
 */
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const targetDir = resolve(import.meta.dirname, "../.next");

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
  console.info("✅ .next ディレクトリを削除しました。");
} else {
  console.info("ℹ️ .next ディレクトリは存在しません。");
}

