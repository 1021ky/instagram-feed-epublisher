/**
 * @file BFF API 向けの OpenAPI 3.1.0 ドキュメント生成モジュール。
 *
 * Zod v4 スキーマの `.meta()` をそのまま読み取り、実装と乖離しない OpenAPI 仕様書を構築します。
 */
import { createDocument } from "zod-openapi";
import {
  EpubDemoRequestBodySchema,
  EpubErrorResponseSchema,
  EpubRequestBodySchema,
} from "@/lib/epub/epub-request.schema";

/**
 * BFF API（EPUB生成系エンドポイント）の OpenAPI 3.1.0 ドキュメントを構築します。
 */
export function buildBffOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "FeedsToBook BFF API",
      version: "1.0.0",
      description:
        "Instagram投稿からEPUB書籍を生成するNext.js BFF API仕様。リクエスト検証用のZod v4スキーマを単一ソースとして生成されています。",
    },
    paths: {
      "/api/epub": {
        post: {
          summary: "InstagramフィードからEPUBファイルを生成して返却",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: EpubRequestBodySchema,
              },
            },
          },
          responses: {
            "200": {
              description: "EPUBバイナリファイルの生成成功",
              content: {
                "application/epub+zip": {
                  schema: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
            "400": {
              description: "リクエスト不正・排他制約違反・対象投稿0件",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
            "401": {
              description: "未ログインまたはInstagramアクセストークン失効",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
            "429": {
              description: "Meta Graph API レート制限超過",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
            "502": {
              description: "Meta Graph API 上流障害",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
            "504": {
              description: "Meta Graph API タイムアウト",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
            "500": {
              description: "サーバー内部エラー",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/api/epub/demo": {
        post: {
          summary: "同梱デモデータセットからEPUBファイルを生成して返却",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: EpubDemoRequestBodySchema,
              },
            },
          },
          responses: {
            "200": {
              description: "デモ用EPUBバイナリファイルの生成成功",
              content: {
                "application/epub+zip": {
                  schema: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
            "400": {
              description: "リクエスト不正・許可されていないデモデータ・対象投稿0件",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
            "500": {
              description: "サーバー内部エラー",
              content: {
                "application/json": {
                  schema: EpubErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/api/openapi.json": {
        get: {
          summary: "BFF API の OpenAPI 3.1.0 仕様書 JSON を取得",
          responses: {
            "200": {
              description: "OpenAPI 3.1.0 ドキュメント",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}
