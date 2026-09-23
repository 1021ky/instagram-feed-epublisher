import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseHTML } from "linkedom";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DataDeletionPage from "./data-deletion/page";
import EnglishPrivacyPage from "./privacy/en/page";
import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";
import { SiteFooter } from "@/components/common/SiteFooter";

/**
 * JSX からレンダリングされた HTML 内のすべての <a> タグの href を抽出する。
 */
function extractLinks(element: ReactElement): string[] {
  const html = renderToStaticMarkup(element);
  const { document } = parseHTML(html);
  const anchors = Array.from(document.querySelectorAll("a"));
  return anchors
    .map((a) => a.getAttribute("href"))
    .filter((href): href is string => typeof href === "string" && href.trim().length > 0);
}

/**
 * 内部リンクが実在する App Router ページを指しているか、
 * および外部リンクが有効な URL 形式かを検証する。
 */
function verifyLinks(links: string[]) {
  expect(links.length).toBeGreaterThan(0);

  for (const href of links) {
    if (href.startsWith("/")) {
      const cleanPath = href.split("?")[0].split("#")[0];
      const targetPageFile =
        cleanPath === "/"
          ? resolve(process.cwd(), "app/page.tsx")
          : resolve(process.cwd(), `app${cleanPath}/page.tsx`);

      const exists = existsSync(targetPageFile);
      expect(
        exists,
        `リンク切れが検出されました: href="${href}" に対応するページファイル (${targetPageFile}) が存在しません。`,
      ).toBe(true);
    } else if (href.startsWith("http://") || href.startsWith("https://")) {
      expect(() => new URL(href)).not.toThrow();
      const parsed = new URL(href);
      expect(parsed.hostname.length).toBeGreaterThan(0);
      expect(["http:", "https:"]).toContain(parsed.protocol);
    } else if (href.startsWith("#") || href.startsWith("mailto:")) {
      expect(href.length).toBeGreaterThan(1);
    } else {
      throw new Error(`不正なリンク形式が検出されました: "${href}"`);
    }
  }
}

describe("サイト内リンク切れ検証テスト", () => {
  it("SiteFooter のすべてのリンク先が実在すること", () => {
    const links = extractLinks(<SiteFooter />);
    expect(links).toContain("/privacy");
    expect(links).toContain("/terms");
    expect(links).toContain("/data-deletion");
    verifyLinks(links);
  });

  it("/privacy（日本語版）のすべての内部リンクおよび外部リンクが有効であること", () => {
    const links = extractLinks(<PrivacyPage />);
    expect(links).toContain("/");
    expect(links).toContain("/data-deletion");
    verifyLinks(links);
  });

  it("/privacy/en（英語版）のすべての内部リンクおよび外部リンクが有効であること", () => {
    const links = extractLinks(<EnglishPrivacyPage />);
    expect(links).toContain("/");
    expect(links).toContain("/data-deletion");
    verifyLinks(links);
  });

  it("/terms（利用規約）のすべての内部リンクおよび外部リンクが有効であること", () => {
    const links = extractLinks(<TermsPage />);
    expect(links).toContain("/");
    expect(links).toContain("/privacy");
    expect(links).toContain("/data-deletion");
    verifyLinks(links);
  });

  it("/data-deletion（データ削除手順）のすべての内部リンクおよび外部リンクが有効であること", () => {
    const links = extractLinks(<DataDeletionPage />);
    expect(links).toContain("/");
    expect(links).toContain("/privacy");
    expect(links).toContain("https://www.instagram.com/accounts/manage_access/");
    verifyLinks(links);
  });

  describe("リンク切れ検知自体の妥当性検証", () => {
    it("存在しない内部リンクを渡すとエラーをスローすること", () => {
      expect(() => verifyLinks(["/non-existent-route"])).toThrow(/リンク切れが検出されました/);
    });

    it("無効なプロトコルや形式のリンクを渡すとエラーをスローすること", () => {
      expect(() => verifyLinks(["ftp://example.com"])).toThrow(/不正なリンク形式が検出されました/);
    });
  });
});
