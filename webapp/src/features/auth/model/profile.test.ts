import { describe, expect, it } from "vitest";
import {
  createDemoUserProfile,
  formatLogoutBannerTitle,
  normalizeUsername,
  toLoggedInUserProfile,
} from "./profile";

describe("ログインユーザープロフィール変換 (toLoggedInUserProfile)", () => {
  it.each([
    {
      label: "ユーザー未定義 (undefined)",
      input: undefined,
      expected: null,
    },
    {
      label: "ユーザーが null",
      input: null,
      expected: null,
    },
    {
      label: "name と image が揃っている通常ユーザー",
      input: {
        id: "u1",
        name: "alice",
        email: "alice@instagram.local",
        image: "https://example.com/a.jpg",
      },
      expected: {
        id: "u1",
        username: "alice",
        displayName: "alice",
        avatarUrl: "https://example.com/a.jpg",
      },
    },
    {
      label: "name が null で @instagram.local メールからフォールバック解決",
      input: {
        id: "u2",
        name: null,
        email: "bob@instagram.local",
        image: null,
      },
      expected: {
        id: "u2",
        username: "bob",
        displayName: "bob",
        avatarUrl: undefined,
      },
    },
    {
      label: "name が null で外部ドメインメールの場合はユーザー名未定義",
      input: {
        id: "u3",
        name: null,
        email: "carol@example.com",
        image: null,
      },
      expected: {
        id: "u3",
        username: undefined,
        displayName: undefined,
        avatarUrl: undefined,
      },
    },
  ])("$label のとき期待通りのプロフィールを返すこと", ({ input, expected }) => {
    expect(toLoggedInUserProfile(input)).toEqual(expected);
  });
});

describe("デモユーザープロフィール生成 (createDemoUserProfile)", () => {
  it("デモ用サンプル情報から固定 ID のプロフィールを生成すること", () => {
    expect(
      createDemoUserProfile({
        username: "demo_creator",
        avatarUrl: "https://example.com/demo.png",
      }),
    ).toEqual({
      id: "demo-user",
      username: "demo_creator",
      displayName: "Demo User",
      avatarUrl: "https://example.com/demo.png",
    });
  });
});

describe("ユーザー名の先頭 @ 除去 (normalizeUsername)", () => {
  it.each([
    { label: "未定義 (undefined)", input: undefined, expected: "" },
    { label: "null", input: null, expected: "" },
    { label: "先頭 @ あり", input: "@alice", expected: "alice" },
    { label: "先頭 @ なし", input: "alice", expected: "alice" },
  ])("$label のとき '$expected' を返すこと", ({ input, expected }) => {
    expect(normalizeUsername(input)).toBe(expected);
  });
});

describe("ログアウト通知バナー見出しの生成 (formatLogoutBannerTitle)", () => {
  it.each([
    {
      label: "未定義 (undefined)",
      username: undefined,
      expected: "FeedsToBook からログアウトしました",
    },
    { label: "空文字", username: "", expected: "FeedsToBook からログアウトしました" },
    { label: "空白のみ", username: "   ", expected: "FeedsToBook からログアウトしました" },
    {
      label: "@なしのユーザー名",
      username: "haneprod",
      expected: "FeedsToBook からログアウトしました（@haneprod）",
    },
    {
      label: "@付きのユーザー名",
      username: "@haneprod",
      expected: "FeedsToBook からログアウトしました（@haneprod）",
    },
  ])("$label のとき '$expected' を返すこと", ({ username, expected }) => {
    expect(formatLogoutBannerTitle(username)).toBe(expected);
  });
});
