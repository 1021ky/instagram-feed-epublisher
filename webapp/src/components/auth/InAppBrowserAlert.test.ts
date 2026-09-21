import { describe, expect, it } from "vitest";
import { isInstagramOrFacebookInAppBrowser } from "./InAppBrowserAlert";

describe("isInstagramOrFacebookInAppBrowser", () => {
  it("Instagram アプリ内ブラウザを検知できること", () => {
    expect(
      isInstagramOrFacebookInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Instagram 352.1.0.0.42",
      ),
    ).toBe(true);
  });

  it("Facebook アプリ内ブラウザを検知できること", () => {
    expect(
      isInstagramOrFacebookInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/520.0.0.0.22]",
      ),
    ).toBe(true);
  });

  it("通常ブラウザでは false を返すこと", () => {
    expect(
      isInstagramOrFacebookInAppBrowser(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});
