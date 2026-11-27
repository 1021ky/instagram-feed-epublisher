import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostThumbnail } from "./PostThumbnail";

describe("投稿サムネイル (PostThumbnail)", () => {
  it.each([
    {
      label: "画像 URL あり・連番あり・カルーセルなし",
      props: {
        src: "https://example.com/photo.jpg",
        alt: "テスト投稿",
        index: 1,
      },
      expectedContains: ["https://example.com/photo.jpg", "#1"],
      expectedNotContains: ["画像なし"],
    },
    {
      label: "画像 URL なし（フォールバック表示）",
      props: {
        src: undefined,
        alt: "画像なし投稿",
      },
      expectedContains: ["画像なし"],
      expectedNotContains: ["<img"],
    },
    {
      label: "カルーセル複数枚バッジ表示",
      props: {
        src: "https://example.com/c1.jpg",
        alt: "複数枚投稿",
        index: 3,
        selectedCarouselCount: 2,
        totalCarouselCount: 4,
      },
      expectedContains: ["#3", "2/4枚"],
      expectedNotContains: ["画像なし"],
    },
  ])("$label の描画仕様を満たすこと", ({ props, expectedContains, expectedNotContains }) => {
    const html = renderToStaticMarkup(<PostThumbnail {...props} />);
    for (const text of expectedContains) {
      expect(html).toContain(text);
    }
    for (const text of expectedNotContains) {
      expect(html).not.toContain(text);
    }
  });
});
