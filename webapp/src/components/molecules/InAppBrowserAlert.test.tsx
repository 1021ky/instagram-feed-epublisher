import { describe, expect, it } from "vitest";
import { isInstagramOrFacebookInAppBrowser } from "./InAppBrowserAlert";

describe("アプリ内ブラウザ判定 (isInstagramOrFacebookInAppBrowser)", () => {
  it.each([
    {
      label: "Instagram アプリ内ブラウザ",
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Instagram 352.1.0.0.42",
      expected: true,
    },
    {
      label: "Facebook アプリ内ブラウザ",
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/520.0.0.0.22]",
      expected: true,
    },
    {
      label: "通常のブラウザ (Chrome / Safari)",
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
      expected: false,
    },
  ])("$label を正しく判定できること", ({ ua, expected }) => {
    expect(isInstagramOrFacebookInAppBrowser(ua)).toBe(expected);
  });
});
