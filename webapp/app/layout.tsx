/**
 * @file Next.js App Router ルートレイアウト
 */
import { SiteFooter } from "@/components/common/SiteFooter";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "FeedsToBook - Instagramフィードから電子書籍を作成",
  description:
    "Instagramの投稿や100日チャレンジをまとめて、Kindleや電子書籍リーダーで読める本に仕立てるWebアプリ",
};

/**
 * ルートレイアウトコンポーネント。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-zinc-50 text-zinc-900 antialiased flex flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
