/**
 * @file Vitest Browser Mode 用の next/link 互換シム。
 * Next.js ルーターに依存せず標準の <a> 要素として描画します。
 */
import type * as React from "react";

type UrlObject = {
  pathname?: string | null;
  search?: string | null;
  hash?: string | null;
};

export interface NextLinkShimProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  href: string | UrlObject;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string | false;
}

function resolveHref(href: string | UrlObject): string {
  if (typeof href === "string") {
    return href;
  }
  return `${href.pathname ?? ""}${href.search ?? ""}${href.hash ?? ""}`;
}

export default function NextLinkShim({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  locale: _locale,
  children,
  ...rest
}: NextLinkShimProps) {
  return (
    <a href={resolveHref(href)} {...rest}>
      {children}
    </a>
  );
}
