/**
 * @file Unit tests for Instagram OAuth endpoint URL resolution (`auth.ts`).
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_INSTAGRAM_OAUTH_AUTHORIZE_URL,
  DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL,
  resolveInstagramOAuthUrls,
} from "./auth";

const originalAuthorizeEnv = process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL;
const originalTokenEnv = process.env.INSTAGRAM_OAUTH_TOKEN_URL;

afterEach(() => {
  if (originalAuthorizeEnv === undefined) {
    delete process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL;
  } else {
    process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = originalAuthorizeEnv;
  }

  if (originalTokenEnv === undefined) {
    delete process.env.INSTAGRAM_OAUTH_TOKEN_URL;
  } else {
    process.env.INSTAGRAM_OAUTH_TOKEN_URL = originalTokenEnv;
  }
});

describe("Instagram OAuth エンドポイント URL 解決 (resolveInstagramOAuthUrls)", () => {
  it.each([
    { label: "未定義 (undefined)", value: undefined },
    { label: "空文字", value: "" },
    { label: "空白のみ", value: "   " },
    { label: "スラッシュのみ", value: "///" },
  ])(
    "環境変数が $label の場合、認可・トークン交換ともに本番デフォルト URL へフォールバックする",
    ({ value }) => {
      if (value === undefined) {
        delete process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL;
        delete process.env.INSTAGRAM_OAUTH_TOKEN_URL;
      } else {
        process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = value;
        process.env.INSTAGRAM_OAUTH_TOKEN_URL = value;
      }

      expect(resolveInstagramOAuthUrls()).toEqual({
        authorizeUrl: DEFAULT_INSTAGRAM_OAUTH_AUTHORIZE_URL,
        tokenUrl: DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL,
      });
    },
  );

  it("カスタム URL（前後空白・末尾スラッシュあり）が指定された場合に正規化して返す", () => {
    process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = "  http://127.0.0.1:4010/oauth/authorize///  ";
    process.env.INSTAGRAM_OAUTH_TOKEN_URL = "http://127.0.0.1:4010/oauth/access_token/";

    expect(resolveInstagramOAuthUrls()).toEqual({
      authorizeUrl: "http://127.0.0.1:4010/oauth/authorize",
      tokenUrl: "http://127.0.0.1:4010/oauth/access_token",
    });
  });

  it("片方の環境変数のみ指定された場合、未指定側は本番デフォルト URL を維持する", () => {
    process.env.INSTAGRAM_OAUTH_AUTHORIZE_URL = "http://127.0.0.1:4010/oauth/authorize";
    delete process.env.INSTAGRAM_OAUTH_TOKEN_URL;

    expect(resolveInstagramOAuthUrls()).toEqual({
      authorizeUrl: "http://127.0.0.1:4010/oauth/authorize",
      tokenUrl: DEFAULT_INSTAGRAM_OAUTH_TOKEN_URL,
    });
  });
});
