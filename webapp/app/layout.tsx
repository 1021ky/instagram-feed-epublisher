/**
 * @file Next.js App Router ルートレイアウト
 */
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Instagram Feed ePublisher",
  description: "Backend for Instagram SSO and EPUB generation",
};

/**
 * ルートレイアウトコンポーネント。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
