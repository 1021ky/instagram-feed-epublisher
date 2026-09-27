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

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("localhost ではリダイレクトしない", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(createRequest("http://localhost:3000/feed?tag=dev"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("auth API パスは本番でもリダイレクトしない", () => {
    process.env.NODE_ENV = "production";

    const response = middleware(
      createRequest("https://service-12345-an.a.run.app/api/auth/sign-in/instagram"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("matcher で静的アセットと auth API を除外する", () => {
    expect(config).toEqual({
      matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
    });
  });
});
