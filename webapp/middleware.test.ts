import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, middleware } from "./middleware";

const originalNodeEnv = process.env.NODE_ENV;

const createRequest = (url: string, headers?: HeadersInit) => new NextRequest(url, { headers });

describe("middleware", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("本番環境では非正規ホストを独自ドメインへ301リダイレクトする", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(
      createRequest("https://service-12345-an.a.run.app/feed?tag=nextjs"),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://feedstobook.ksanchu.page/feed?tag=nextjs",
    );
  });

  it("内部ポート（:8080等）が含まれていてもリダイレクト先にポート番号が混入しない", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(
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
    process.env.NODE_ENV = "production";

    const response = middleware(createRequest("https://feedstobook.ksanchu.page/feed"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("リバースプロキシ環境で x-forwarded-host が正規ホストの場合はリダイレクトしない", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(
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
    process.env.NODE_ENV = "production";

    const response = middleware(
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
    process.env.NODE_ENV = "development";

    const response = middleware(createRequest("http://localhost:3000/feed?tag=dev"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("auth API パスも本番では正規ホストへリダイレクトする", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(
      createRequest(
        "https://service-12345-an.a.run.app/api/auth/sign-in/instagram?provider=instagram",
      ),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://feedstobook.ksanchu.page/api/auth/sign-in/instagram?provider=instagram",
    );
  });

  it("matcher で静的アセットのみを除外する", () => {
    expect(config).toEqual({
      matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
    });
  });
});
