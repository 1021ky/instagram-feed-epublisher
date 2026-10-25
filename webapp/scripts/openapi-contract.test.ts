/**
 * @file Unit & contract tests for OpenAPI 3.1 specification and local Mock Instagram Server.
 */
import { describe, expect, it } from "vitest";
import {
  assertValidOpenApiSchema,
  loadInstagramOpenApiSpec,
  validateOpenApiSchema,
} from "./openapi-contract.mjs";
import { createMockInstagramHandler } from "./mock-instagram-server.mjs";

describe("OpenAPI 3.1 Contract Specification & Validator", () => {
  const spec = loadInstagramOpenApiSpec();

  it("loads docs/openapi/instagram-graph-api.openapi.yaml with OpenAPI 3.1.0 metadata and schemas", () => {
    expect(spec.openapi).toBe("3.1.0");
    const paths = spec.paths as Record<string, unknown>;
    expect(paths["/me/media"]).toBeDefined();
    expect(paths["/api/instagram/hashtags"]).toBeDefined();
  });

  it("accepts valid HashtagSuggestionsResponse payloads", () => {
    const result = validateOpenApiSchema(spec, "HashtagSuggestionsResponse", {
      hashtags: [
        {
          tag: "100日チャレンジ",
          count: 12,
          lastUsedAt: "2026-10-20T09:00:00.000Z",
        },
      ],
      scannedPosts: 42,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects HashtagSuggestionsResponse payloads missing required fields or having extra properties", () => {
    const missingField = validateOpenApiSchema(spec, "HashtagSuggestionsResponse", {
      hashtags: [{ tag: "京都カフェ", count: 0, lastUsedAt: "not-a-date" }],
    });
    expect(missingField.valid).toBe(false);
    expect(missingField.errors.length).toBeGreaterThanOrEqual(3);

    expect(() =>
      assertValidOpenApiSchema(spec, "BffErrorResponse", {
        error: "",
        unexpectedKey: true,
      }),
    ).toThrow(/OpenAPI contract violation/);
  });

  it("serves OpenAPI-validated OAuth, /me, and /me/media responses from createMockInstagramHandler", async () => {
    const handler = createMockInstagramHandler({
      baseDate: new Date("2026-10-20T09:00:00.000Z"),
    });
    const baseUrl = "http://127.0.0.1:4010";

    // 1. Health check
    const healthRes = await handler(new Request(`${baseUrl}/health`));
    expect(healthRes.status).toBe(200);

    // 2. OAuth authorize redirect
    const authRes = await handler(
      new Request(
        `${baseUrl}/oauth/authorize?client_id=test&redirect_uri=${encodeURIComponent("http://localhost:3100/callback")}&response_type=code&state=xyz`,
      ),
    );
    expect(authRes.status).toBe(302);
    expect(authRes.headers.get("location")).toBe(
      "http://localhost:3100/callback?code=mock_ig_auth_code_e2e&state=xyz",
    );

    // 3. Short-lived & long-lived token exchange
    const shortRes = await handler(
      new Request(`${baseUrl}/oauth/access_token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "code=mock_ig_auth_code_e2e&grant_type=authorization_code",
      }),
    );
    expect(shortRes.status).toBe(200);
    const shortJson = (await shortRes.json()) as { access_token: string };
    assertValidOpenApiSchema(spec, "OAuthShortTokenResponse", shortJson);

    const longRes = await handler(
      new Request(
        `${baseUrl}/access_token?grant_type=ig_exchange_token&client_secret=sec&access_token=${shortJson.access_token}`,
      ),
    );
    expect(longRes.status).toBe(200);
    const longJson = (await longRes.json()) as { access_token: string };
    assertValidOpenApiSchema(spec, "OAuthLongTokenResponse", longJson);

    // 4. /me profile
    const meRes = await handler(
      new Request(`${baseUrl}/me?fields=id,username&access_token=${longJson.access_token}`),
    );
    expect(meRes.status).toBe(200);
    assertValidOpenApiSchema(spec, "GraphUserProfile", await meRes.json());

    // 5. /me/media pagination & OpenAPI contract validation
    const mediaPage1 = await handler(
      new Request(
        `${baseUrl}/me/media?fields=id,caption,media_url,permalink,timestamp&limit=3&access_token=${longJson.access_token}`,
      ),
    );
    expect(mediaPage1.status).toBe(200);
    const mediaJson1 = (await mediaPage1.json()) as {
      data: unknown[];
      paging?: { cursors?: { after?: string } };
    };
    assertValidOpenApiSchema(spec, "GraphMediaListResponse", mediaJson1);
    expect(mediaJson1.data).toHaveLength(3);
    expect(mediaJson1.paging?.cursors?.after).toBe("3");

    // 6. Invalid token error conforms to GraphErrorResponse
    const errRes = await handler(
      new Request(`${baseUrl}/me/media?fields=id&access_token=invalid_token`),
    );
    expect(errRes.status).toBe(400);
    assertValidOpenApiSchema(spec, "GraphErrorResponse", await errRes.json());
  });
});
