/**
 * @file 投稿メタヘッダー (PostMetaHeader) の単体テスト
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostMetaHeader } from "./PostMetaHeader";

describe("投稿メタヘッダー (PostMetaHeader)", () => {
  it.each([
    {
      label: "外部リンクあり",
      permalink: "https://instagram.com/p/sample123",
      shouldContainLink: true,
    },
    {
      label: "外部リンクなし",
      permalink: undefined,
      shouldContainLink: false,
    },
  ])(
    "$label のときに日時とリンク表示を正しく切り替えること",
    ({ permalink, shouldContainLink }) => {
      const html = renderToStaticMarkup(
        <PostMetaHeader
          formattedDate="2026/09/20 19:30"
          isoTimestamp="2026-09-20T10:30:00Z"
          permalink={permalink}
        />,
      );

      expect(html).toContain('dateTime="2026-09-20T10:30:00Z"');
      expect(html).toContain("2026/09/20 19:30");
      if (shouldContainLink) {
        expect(html).toContain("https://instagram.com/p/sample123");
        expect(html).toContain("表示");
      } else {
        expect(html).not.toContain("表示");
      }
    },
  );
});
