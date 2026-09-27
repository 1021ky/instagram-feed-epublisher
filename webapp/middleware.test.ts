import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, middleware } from "./middleware";

const originalNodeEnv = process.env.NODE_ENV;

const createRequest = (url: string) => new NextRequest(url);

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

  it("正規ホストではリダイレクトしない", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(createRequest("https://feedstobook.ksanchu.page/feed"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("localhost の開発環境ではリダイレクトしない", () => {
    process.env.NODE_ENV = "development";

    const response = middleware(createRequest("http://localhost:3000/feed?tag=dev"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("auth API パスは本番でもリダイレクトしない", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(
      createRequest("https://service-12345-an.a.run.app/api/auth/sign-in/instagram"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("matcher で静的アセットを除外し、auth API はミドルウェア本体でバイパスする", () => {
    expect(config).toEqual({
      matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
    });
  });
});
