import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HashtagFilterField } from "./HashtagFilterField";

describe("ハッシュタグ絞り込み入力セクション (HashtagFilterField)", () => {
  it.each([
    {
      label: "通常モード",
      hashtag: "#100日チャレンジ",
      isDemoMode: false,
      expectReadOnly: false,
    },
    {
      label: "デモモード（readOnly かつ非 disabled）",
      hashtag: "100日チャレンジ",
      isDemoMode: true,
      expectReadOnly: true,
    },
  ])(
    "$label で入力欄・datalist・先頭シャープ除去が正しく描画されること",
    ({ hashtag, isDemoMode, expectReadOnly }) => {
      const html = renderToStaticMarkup(
        <HashtagFilterField
          hashtag={hashtag}
          onHashtagChange={vi.fn()}
          suggestions={[
            { tag: "100日チャレンジ", count: 12, lastUsedAt: "2026-09-20T09:00:00.000Z" },
          ]}
          isLoadingSuggestions={false}
          isDemoMode={isDemoMode}
          onDemoBlocked={vi.fn()}
        />,
      );

      expect(html).toContain("ハッシュタグ絞り込み");
      expect(html).toContain('value="100日チャレンジ"');
      expect(html).toContain('list="hashtag-suggestions"');
      expect(html).toContain('<datalist id="hashtag-suggestions">');
      expect(html).not.toContain('disabled=""');
      if (expectReadOnly) {
        expect(html).toMatch(/readonly/i);
        expect(html).toContain("cursor-not-allowed");
      } else {
        expect(html).not.toMatch(/readonly/i);
      }
    },
  );
});
