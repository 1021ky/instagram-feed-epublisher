import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostFooterStatus } from "./PostFooterStatus";

describe("投稿フッターステータス (PostFooterStatus)", () => {
  it.each([
    {
      label: "収録対象・いいね数あり",
      likeCount: 1250,
      selected: true,
      expectedStatus: "収録対象",
      expectedLike: "1,250",
    },
    {
      label: "除外・いいね数なし",
      likeCount: undefined,
      selected: false,
      expectedStatus: "除外",
      expectedLike: undefined,
    },
  ])("$label を正しく表示すること", ({ likeCount, selected, expectedStatus, expectedLike }) => {
    const html = renderToStaticMarkup(
      <PostFooterStatus likeCount={likeCount} selected={selected} />,
    );

    expect(html).toContain(expectedStatus);
    if (expectedLike) {
      expect(html).toContain(expectedLike);
    } else {
      expect(html).not.toContain("いいね:");
    }
  });
});
