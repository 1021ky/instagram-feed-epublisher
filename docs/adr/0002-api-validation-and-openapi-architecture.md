# ADR-0002: Next.js Route Handler の責務分離と Zod v4 ＋ `zod-openapi` による BFF 契約管理

- **ステータス**: Accepted
- **日付**: 2026-11-23

## 1. 背景 (Context)

初期実装の `webapp/app/api/epub/route.ts` は、1 ファイル（約 230 行）の中に以下の責務が混在していました。

1. HTTP リクエストのパースおよび手書きの型ガード・バリデーション（`validatePayload` と多数のヘルパー関数）
2. 認証セッションからのアクセストークン解決
3. Instagram Graph API からの投稿取得・絞り込み・選択投稿抽出
4. 一時ディレクトリの作成・削除と EPUB 生成
5. 全例外を一律 `400` として返却するエラーハンドリング

また、`POST /api/epub/demo` との間でもテーマ・並び順のフォールバック解決、一時ディレクトリ管理、バイナリレスポンス構築が重複していました。

一方で本リポジトリには、すでに外部 Meta Graph API および内部 BFF（`/api/instagram/hashtags`）の結合・契約テスト基盤として `docs/openapi/instagram-graph-api.openapi.yaml`（OpenAPI 3.1.0）とローカルモックサーバー（`webapp/scripts/mock-instagram-server.mjs`）が整備されています。

この状況を踏まえ、**「プロダクションコードの責務分離」「型チェックとランタイムバリデーションの簡潔な一元化」「Instagram API との結合・契約テストの維持・拡張」**をバランスよく実現するための設計方式を選定する必要がありました。

## 2. 検討した選択肢 (Options Considered)

| 案                                                                     | 概要                                                                                                                                                   | メリット                                                                                                                                                           | デメリット                                                                                                                                                    |
| :--------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **案1: Next.js Route Handler 維持 ＋ Zod v4 ＋ `zod-openapi`（採用）** | Route Handler を薄い HTTP 境界へ整理し、`src/lib/epub/` へ Zod v4 スキーマ（`.meta()`）とサービス層を切り出し、`zod-openapi` で OpenAPI 3.1 を生成する | 既存の Next.js ファイルベースルーティング・Better Auth・Vitest テスト基盤を壊さずに責務分離できる。Zod スキーマから実行時検証・TS 型・OpenAPI 仕様を一元管理できる | Route Handler 実装と `createDocument` へのパス登録は別ファイルになるため、新規 API 追加時の登録漏れをテストで検知する必要がある                               |
| **案2: Zod v4 単体（OpenAPI ドキュメント生成なし）**                   | Zod v4 によるバリデーションと型推論のみ導入し、OpenAPI 生成は行わない                                                                                  | 依存追加が最小限（`zod` のみ）                                                                                                                                     | 内部 BFF エンドポイントの OpenAPI 仕様（`paths` / ステータスコード / バイナリ応答定義）がコードと連動せず手動管理が残る                                       |
| **案3: Hono（`hono-openapi` / `@hono/zod-openapi`）の Next.js 統合**   | `app/api/[[...route]]/route.ts` 配下を Hono に置き換え、ルーティング・ミドルウェア・検証・OpenAPI 生成を統合する                                       | ルート定義・検証・OpenAPI 生成・共通ミドルウェアが完全に一体化し、大規模 API で高い生産性を発揮する                                                                | 現時点の API 本数（約 5 本）に対しては既存 Route Handler / Better Auth / Vitest 結合テストからの移行コストが過大                                              |
| **案4: OpenAPI YAML 正本 ＋ Orval 等によるコード生成（Schema-First）** | OpenAPI YAML を手書きし、Zod スキーマやクライアントコードを自動生成する                                                                                | 多言語バックエンド・別リポジトリ構成で強力な契約駆動を実現できる                                                                                                   | TypeScript フルスタック構成では YAML 手書きと生成パイプラインが冗長になり、`selectedMediaIds` / `excludedMediaIds` 排他等の複合制約を YAML だけで表現しにくい |

## 3. 決定 (Decision)

**案1（Next.js Route Handler 維持 ＋ Zod v4 ＋ `zod-openapi`）** を採用します。

### 採用理由

1. **現時点の要求への適合性**: 本アプリは Next.js App Router 完結型の小規模 BFF であり、今時点で優先すべきは「プロダクションコードの責務分離（HTTP 境界 / 入力検証 / アプリケーションサービス）」と「Instagram API との結合・契約テストを確実に回せること」であると判断しました。
2. **既存資産との親和性**: Next.js Route Handler のまま責務分離することで、既存の Better Auth（`/api/auth/[...all]`）や Instagram Graph API モックサーバーを用いた結合テスト資産をそのまま活用できます。
3. **Zod v4 ネイティブ `.meta()` の活用**: Zod v4 の `.meta()` と `zod-openapi` を組み合わせることで、モンキーパッチ（`.openapi()`）に頼らない純粋な Zod スキーマから OpenAPI 3.1.0（`GET /api/openapi.json`）を生成でき、フロントエンド UI バリデーション（`metadata.title` 必須チェック等）とも同じルールを共有できます。

### 実装方針

1. `webapp/src/lib/epub/epub-request.schema.ts` に Zod v4 入力スキーマ・正規化パーサー・UI 共有タイトル検証ヘルパーを集約する。
2. `webapp/src/lib/epub/epub-generation-service.ts` と `webapp/src/lib/epub/http-response.ts` にビジネスオーケストレーション、一時ディレクトリ管理、HTTP エラーマッピング（`400` / `401` / `InstagramGraphApiError.recommendedHttpStatus` / `500`）を分離する。
3. `webapp/app/api/epub/route.ts` および `webapp/app/api/epub/demo/route.ts` は薄い HTTP アダプターに限定する。
4. `webapp/src/lib/openapi/bff-document.ts` および `GET /api/openapi.json` で OpenAPI 3.1.0 仕様を生成・検証する。

## 4. 影響・トレードオフ (Consequences)

- **外部 API 契約との棲み分け**: Meta (Instagram) Graph API の仕様モック用には引き続き `docs/openapi/instagram-graph-api.openapi.yaml` を維持し、内部 BFF の EPUB 生成系エンドポイントは Zod v4 スキーマから `zod-openapi` で OpenAPI 3.1 を生成します。
- **将来的な Hono 導入の再検討条件**: 今後 API エンドポイント数が大幅に増加しルート単位の横断ミドルウェア（レート制限・監査ログ等）の統一管理が課題となった場合、または BFF を Next.js から独立したエッジ/コンテナランタイムへ分離する必要が生じた場合は、Hono への段階的移行を再検討します。
