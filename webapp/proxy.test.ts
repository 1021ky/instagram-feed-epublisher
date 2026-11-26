import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, proxy } from "./proxy";

const createRequest = (url: string, headers?: HeadersInit) => new NextRequest(url, { headers });

describe("正規ホストリダイレクト Proxy (proxy)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("本番環境では非正規ホストを独自ドメインへ301リダイレクトする", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = proxy(createRequest("https://service-12345-an.a.run.app/feed?tag=nextjs"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://feedstobook.ksanchu.page/feed?tag=nextjs",
    );
  });

  it("内部ポート（:8080等）が含まれていてもリダイレクト先にポート番号が混入しない", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = proxy(
      createRequest("http://localhost:8080/feed?tag=nextjs", {
        host: "localhost:8080",
      }),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://feedstobook.ksanchu.page/feed?tag=nextjs",
    );
  });

  it("正規ホストではリダイレクトしない", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = proxy(createRequest("https://feedstobook.ksanchu.page/feed"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("リバースプロキシ環境で x-forwarded-host が正規ホストの場合はリダイレクトしない", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = proxy(
      createRequest("http://localhost:8080/feed", {
        host: "service-12345-an.a.run.app:8080",
        "x-forwarded-host": "feedstobook.ksanchu.page",
        "x-forwarded-proto": "https",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("x-forwarded-host にポート（:443等）が含まれていても正規ホストとして認識する", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = proxy(
      createRequest("http://localhost:8080/feed", {
        host: "service-12345-an.a.run.app:8080",
        "x-forwarded-host": "feedstobook.ksanchu.page:443",
        "x-forwarded-proto": "https",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("localhost の開発環境ではリダイレクトしない", () => {
    vi.stubEnv("NODE_ENV", "development");

    const response = proxy(createRequest("http://localhost:3000/feed?tag=dev"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("auth API パスも本番では正規ホストへリダイレクトする", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = proxy(
      createRequest(
        "https://service-12345-an.a.run.app/api/auth/sign-in/instagram?provider=instagram",
      ),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://feedstobook.ksanchu.page/api/auth/sign-in/instagram?provider=instagram",
    );
  });

  it.each([
    { label: "トップページへの通常アクセス", url: "https://example.com/", expected: true },
    {
      label: "auth API パスへの通常アクセス",
      url: "https://example.com/api/auth/sign-in/instagram",
      expected: true,
    },
    {
      label: "Next.js 静的アセット (_next/static)",
      url: "https://example.com/_next/static/chunks/main.js",
      expected: false,
    },
    {
      label: "Next.js 画像最適化 (_next/image)",
      url: "https://example.com/_next/image?url=%2Ftest.png&w=64&q=75",
      expected: false,
    },
    {
      label: "ファビコン (favicon.ico)",
      url: "https://example.com/favicon.ico",
      expected: false,
    },
    {
      label: "Next.js ルータープリフェッチ (next-router-prefetch)",
      url: "https://example.com/privacy",
      headers: { "next-router-prefetch": "1" },
      expected: false,
    },
    {
      label: "ブラウザプリフェッチ (purpose: prefetch)",
      url: "https://example.com/privacy",
      headers: { purpose: "prefetch" },
      expected: false,
    },
  ])("matcher が $label に対して $expected を返す", ({ url, headers, expected }) => {
    expect(unstable_doesMiddlewareMatch({ config, url, headers })).toBe(expected);
  });
});
