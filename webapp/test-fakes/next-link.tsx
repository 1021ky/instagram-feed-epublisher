/**
 * @file ブラウザテスト用の next/link フェイク。
 */
import type * as React from "react";

type UrlObject = {
  pathname?: string | null;
  search?: string | null;
  hash?: string | null;
};

export interface FakeNextLinkProps extends Omit<
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

export default function FakeNextLink({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  locale: _locale,
  children,
  ...rest
}: FakeNextLinkProps) {
  return (
    <a href={resolveHref(href)} {...rest}>
      {children}
    </a>
  );
}
