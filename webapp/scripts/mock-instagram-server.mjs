/**
 * @file OpenAPI-compliant local Mock Instagram OAuth & Graph API server.
 *
 * Used during Playwright E2E tests (Option A) so the full Next.js stack
 * (`Better Auth` -> `session-service.ts` -> `/api/instagram/hashtags` & `/api/instagram/media`
 * -> `graph-client.ts` -> `meta-api-client.ts`) runs end-to-end over HTTP without ever
 * touching live `instagram.com` / `graph.instagram.com` servers.
 *
 * Every response payload is runtime-validated against `docs/openapi/instagram-graph-api.openapi.yaml`.
 */
import http from "node:http";
import { pathToFileURL } from "node:url";
import { assertValidOpenApiSchema, loadInstagramOpenApiSpec } from "./openapi-contract.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generates an inline SVG data URL for deterministic offline rendering.
 *
 * @param {number} index
 * @param {string} label
 * @returns {string}
 */
function buildMockSvgDataUrl(index, label) {
  const hue = (index * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="hsl(${hue} 75% 55%)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#fff">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Builds deterministic mock Instagram media items relative to `baseDate`.
 *
 * Expected hashtag counts across these 8 posts:
 * - `100日チャレンジ`: 4 posts
 * - `京都カフェ`: 3 posts
 * - `朝活`: 2 posts
 * - `読書記録`: 2 posts
 * - `写真好きな人と繋がりたい`: 1 post
 * - `travel`: 1 post
 * (`https://example.com#ignore` is NOT a hashtag and must be ignored by `hashtag-service.ts`.)
 *
 * @param {Date} [baseDate]
 */
export function buildDeterministicMockMedia(baseDate = new Date()) {
  const anchorMs = Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate(),
    9,
    0,
    0,
  );

  const rawItems = [
    {
      id: "18000000000000001",
      daysAgo: 1,
      caption: "朝のランニングと読書記録 #100日チャレンジ #朝活 #読書記録",
    },
    {
      id: "18000000000000002",
      daysAgo: 2,
      caption: "お気に入りの抹茶ラテ #京都カフェ #100日チャレンジ",
    },
    {
      id: "18000000000000003",
      daysAgo: 3,
      caption: "鴨川沿いを散歩しました #京都カフェ #写真好きな人と繋がりたい",
    },
    {
      id: "18000000000000004",
      daysAgo: 4,
      caption: "週末のカフェ巡り ＃京都カフェ #100日チャレンジ",
    },
    {
      id: "18000000000000005",
      daysAgo: 5,
      caption: "新しい本を読み始めました #読書記録 #100日チャレンジ #100日チャレンジ",
    },
    {
      id: "18000000000000006",
      daysAgo: 6,
      caption: "早起き成功！ #朝活",
    },
    {
      id: "18000000000000007",
      daysAgo: 7,
      caption: "ハッシュタグなしの日常投稿です。",
    },
    {
      id: "18000000000000008",
      daysAgo: 8,
      caption: "参考リンク https://example.com#ignore と旅メモ #Travel",
    },
  ];

  return rawItems.map((entry, idx) => ({
    id: entry.id,
    caption: entry.caption,
    media_url: buildMockSvgDataUrl(idx + 1, `Post ${idx + 1}`),
    permalink: `https://www.instagram.com/p/mockpost${idx + 1}/`,
    timestamp: new Date(anchorMs - entry.daysAgo * DAY_MS).toISOString(),
  }));
}

/**
 * Builds a Web `Response` after validating its JSON payload against the OpenAPI schema.
 *
 * @param {number} status
 * @param {Record<string, unknown>} spec
 * @param {string | null} schemaName
 * @param {unknown} payload
 * @returns {Response}
 */
function buildValidatedJsonResponse(status, spec, schemaName, payload) {
  if (schemaName) {
    assertValidOpenApiSchema(spec, schemaName, payload);
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/**
 * Creates a fetch-compatible `(request: Request) => Promise<Response>` handler
 * implementing the Instagram OAuth & Graph API OpenAPI contract.
 *
 * @param {{ baseDate?: Date }} [options]
 * @returns {(request: Request) => Promise<Response>}
 */
export function createMockInstagramHandler(options = {}) {
  const spec = loadInstagramOpenApiSpec();
  const mediaItems = buildDeterministicMockMedia(options.baseDate);

  return async function handleMockInstagramRequest(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return buildValidatedJsonResponse(200, spec, null, { status: "ok" });
    }

    // 1. OAuth 2.0 Authorization Redirect
    if (request.method === "GET" && url.pathname === "/oauth/authorize") {
      const clientId = url.searchParams.get("client_id");
      const redirectUri = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state");

      if (!clientId || !redirectUri) {
        return buildValidatedJsonResponse(400, spec, "GraphErrorResponse", {
          error: {
            message: "Missing required OAuth query parameters",
            type: "OAuthException",
            code: 100,
            is_transient: false,
          },
        });
      }

      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set("code", "mock_ig_auth_code_e2e");
      if (state) {
        callbackUrl.searchParams.set("state", state);
      }

      return new Response(null, {
        status: 302,
        headers: { location: callbackUrl.toString() },
      });
    }

    // 2. Short-lived Token Exchange
    if (request.method === "POST" && url.pathname === "/oauth/access_token") {
      const bodyText = await request.text();
      const params = new URLSearchParams(bodyText);
      const code = params.get("code");

      if (!code) {
        return buildValidatedJsonResponse(400, spec, "GraphErrorResponse", {
          error: {
            message: "Missing authorization code",
            type: "OAuthException",
            code: 100,
            is_transient: false,
          },
        });
      }

      return buildValidatedJsonResponse(200, spec, "OAuthShortTokenResponse", {
        access_token: "mock_short_lived_token_e2e",
        user_id: "17841400000001",
        token_type: "bearer",
        expires_in: 3600,
      });
    }

    // 3. Long-lived Token Exchange (ig_exchange_token)
    if (request.method === "GET" && url.pathname === "/access_token") {
      const grantType = url.searchParams.get("grant_type");
      const shortToken = url.searchParams.get("access_token");

      if (grantType !== "ig_exchange_token" || !shortToken) {
        return buildValidatedJsonResponse(400, spec, "GraphErrorResponse", {
          error: {
            message: "Invalid grant_type or missing access_token",
            type: "OAuthException",
            code: 100,
            is_transient: false,
          },
        });
      }

      return buildValidatedJsonResponse(200, spec, "OAuthLongTokenResponse", {
        access_token: "mock_long_lived_token_e2e",
        token_type: "bearer",
        expires_in: 5184000,
      });
    }

    // 4. User Profile (/me)
    if (request.method === "GET" && url.pathname === "/me") {
      const accessToken = url.searchParams.get("access_token");
      if (!accessToken || accessToken === "invalid_token") {
        return buildValidatedJsonResponse(400, spec, "GraphErrorResponse", {
          error: {
            message: "Invalid OAuth access token.",
            type: "OAuthException",
            code: 190,
            is_transient: false,
            fbtrace_id: "mock-trace-auth",
          },
        });
      }

      return buildValidatedJsonResponse(200, spec, "GraphUserProfile", {
        id: "17841400000001",
        username: "e2e_creator",
      });
    }

    // 5. User Media (/me/media)
    if (request.method === "GET" && url.pathname === "/me/media") {
      const accessToken = url.searchParams.get("access_token");
      const fields = url.searchParams.get("fields");

      if (!accessToken || accessToken === "invalid_token") {
        return buildValidatedJsonResponse(400, spec, "GraphErrorResponse", {
          error: {
            message: "Invalid OAuth access token.",
            type: "OAuthException",
            code: 190,
            is_transient: false,
            fbtrace_id: "mock-trace-media-auth",
          },
        });
      }

      if (!fields) {
        return buildValidatedJsonResponse(400, spec, "GraphErrorResponse", {
          error: {
            message: "Missing fields parameter",
            type: "OAuthException",
            code: 100,
            is_transient: false,
          },
        });
      }

      const rawLimit = url.searchParams.get("limit");
      const limit = rawLimit ? Math.min(Math.max(1, Number(rawLimit)), 100) : 25;
      const sinceSec = url.searchParams.get("since")
        ? Number(url.searchParams.get("since"))
        : undefined;
      const untilSec = url.searchParams.get("until")
        ? Number(url.searchParams.get("until"))
        : undefined;
      const afterCursor = url.searchParams.get("after");

      const filtered = mediaItems.filter((item) => {
        const sec = Math.floor(new Date(item.timestamp).getTime() / 1000);
        if (sinceSec !== undefined && Number.isFinite(sinceSec) && sec < sinceSec) {
          return false;
        }
        if (untilSec !== undefined && Number.isFinite(untilSec) && sec > untilSec) {
          return false;
        }
        return true;
      });

      const startIndex = afterCursor ? Number(afterCursor) : 0;
      const safeStart = Number.isInteger(startIndex) && startIndex >= 0 ? startIndex : 0;
      const pageData = filtered.slice(safeStart, safeStart + limit);
      const nextIndex = safeStart + pageData.length;

      /** @type {{ data: typeof pageData; paging?: { cursors: { after: string }; next: string } }} */
      const payload = {
        data: pageData,
      };

      if (nextIndex < filtered.length && pageData.length > 0) {
        const nextUrl = new URL(url.toString());
        nextUrl.searchParams.set("after", String(nextIndex));
        payload.paging = {
          cursors: {
            after: String(nextIndex),
          },
          next: nextUrl.toString(),
        };
      }

      return buildValidatedJsonResponse(200, spec, "GraphMediaListResponse", payload);
    }

    return buildValidatedJsonResponse(404, spec, "GraphErrorResponse", {
      error: {
        message: `Unknown mock endpoint: ${request.method} ${url.pathname}`,
        type: "IGApiException",
        code: 100,
        is_transient: false,
      },
    });
  };
}

/**
 * Reads full Node HTTP request body as UTF-8 string.
 *
 * @param {http.IncomingMessage} req
 * @returns {Promise<string>}
 */
function readNodeBody(req) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * Creates a `node:http` server wrapping `createMockInstagramHandler`.
 *
 * @param {{ baseDate?: Date; baseUrl?: string }} [options]
 */
export function createMockInstagramServer(options = {}) {
  const handler = createMockInstagramHandler({ baseDate: options.baseDate });

  return http.createServer(async (req, res) => {
    try {
      const host = req.headers.host ?? "127.0.0.1:4010";
      const origin = options.baseUrl ?? `http://${host}`;
      const fullUrl = new URL(req.url ?? "/", origin).toString();
      const method = req.method ?? "GET";
      const body = method !== "GET" && method !== "HEAD" ? await readNodeBody(req) : undefined;

      const webRes = await handler(
        new Request(fullUrl, {
          method,
          headers: /** @type {Record<string, string>} */ (req.headers),
          body,
        }),
      );

      /** @type {Record<string, string>} */
      const responseHeaders = {};
      webRes.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });
      res.writeHead(webRes.status, responseHeaders);
      const resText = await webRes.text();
      res.end(resText);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: { message } }));
    }
  });
}

const isMain = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const port = Number(process.env.MOCK_INSTAGRAM_PORT ?? 4010);
  const host = process.env.MOCK_INSTAGRAM_HOST ?? "127.0.0.1";
  const server = createMockInstagramServer();

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  server.listen(port, host, () => {
    console.log(`Mock Instagram OpenAPI server listening on http://${host}:${port}`);
  });
}
