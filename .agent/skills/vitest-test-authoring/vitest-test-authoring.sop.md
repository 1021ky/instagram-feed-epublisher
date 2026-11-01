# Vitest 単体・結合テスト実装 SOP

## Overview

`webapp/` 配下の単体テスト・結合テスト（`*.test.ts`, `*.test.tsx`）を新規作成または更新する際の必須手順（Standard Operating Procedure）を定義します。テスト表記言語の統一（`describe` / `it` / `test` すべて日本語）、一時的なテスト番号表記の禁止、因子分析に基づく境界値網羅、およびテスト分離を担保します。

## Steps

### 1. テストケース表記規約（日本語必須・一時番号禁止）

すべてのテストスイート名・テストケース名を、仕様書としてそのまま読める日本語で記述します。

**Constraints:**

- **`describe(...)` も `it(...)` / `test(...)` もすべて日本語で記述すること（MUST）**。
- `it.each(...)` / `test.each(...)` のテンプレート文字列およびテーブル内の表示用ラベル（`label` 等）、ならびに Oxlint `RuleTester` のスイート名・各テストケースの `name` プロパティも日本語で記述すること（MUST）。
- 関数名・API エンドポイント・コンポーネント名を併記する場合は、**日本語の責務・振る舞い名を主とし、識別子は括弧書き等で補助する**形式にすること（例: `describe("Instagram アクセストークン解決 (resolveInstagramAccessToken)", ...)`、`describe("ハッシュタグ候補取得 API の結合・OpenAPI 契約テスト (GET /api/instagram/hashtags)", ...)`）。
- 英語のみの `describe` や `it` / `test`（例: `describe("resolveInstagramAccessToken")`、`it("returns items on success")`、`describe("GET handler")`）を記述してはならない（MUST NOT）。
- PR や計画時の一時的な管理番号（`UT-1:`、`IT-01:`、`TC-01:`、`E2E-1:` 等）をコード上の `describe` / `it` / `test` やコメントに含めてはならない（MUST NOT）。

### 2. 因子分析に基づくテストケース設計

実装対象の入力因子・状態遷移・外部依存レスポンスの水準を洗い出し、漏れなくテストケースを構成します。

**Constraints:**

- 正常系だけでなく、境界値（未定義 `undefined`、空文字、空白・記号のみ、0件、上限クランプ、小数・`NaN`・`Infinity`）および異常系（HTTP エラーステータス伝播、非 JSON エラー本文、タイムアウト・リトライ境界）を因子分析で洗い出すこと（MUST）。
- 同構造の入力水準が複数ある場合は `it.each([...])("... ($label) ...", ...)` を用いて重複コードを抑えつつ日本語ラベルで可読性を保つこと（SHOULD）。

### 3. テスト分離とプロジェクト固有の実装規約

テスト実行順序や外部ネットワークに依存しない決定論的なテストを実装します。

**Constraints:**

- トップレベル `vi.mock(...)` と `afterEach(() => vi.restoreAllMocks())` を併用する場合は、`beforeEach` 内でモックのデフォルト戻り値を毎回明示的に設定し、2件目以降のテストで `undefined` になる順序依存を防ぐこと（MUST）。
- `process.env` や `globalThis.fetch` を書き換えるテストでは、元の値を退避し `afterEach` で確実に復元すること（MUST）。
- React コンポーネントの単体テスト（`*.test.tsx`）は、Vitest の `environment: "node"` 環境上で `react-dom/server` の `renderToStaticMarkup` を用いて軽量・高速に検証すること（SHOULD）。インタラクションを伴うブラウザ実挙動は Playwright E2E（`playwright-e2e-authoring` スキル）で検証する。
- Route Handler 等の結合テストで OpenAPI 定義対象エンドポイントを扱う場合は、`webapp/scripts/openapi-contract.mjs` の `assertValidOpenApiSchema` でレスポンス契約もあわせて検証すること（SHOULD）。

### 4. 品質ゲート実行とセルフレビュー

完了前に機械的チェックと表記監査を実施します。

**Constraints:**

- `pnpm test`、`pnpm lint`、`pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` を実行し、すべてエラー・警告 0 件で通過することを確認すること（MUST）。
- 変更・追加したテストファイル内のすべての `describe` / `it` / `test` が日本語で記述されており、英語のみのタイトルや一時番号プレフィックスが残っていないことを目視または検索で確認すること（MUST）。
