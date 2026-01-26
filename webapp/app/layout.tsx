/**
 * @file Root layout for the Next.js App Router.
 */
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Instagram Feed ePublisher",
  description: "Backend for Instagram SSO and EPUB generation",
};

/**
 * Root layout component.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
