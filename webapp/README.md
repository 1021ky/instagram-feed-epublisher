# Webapp

## 開発

- Next.js: `pnpm dev`
- HTTPS（mkcert）: `pnpm dev:https`

### HTTPS（mkcert）セットアップ

1. mkcertをインストール（未導入の場合）
2. ルートCAをインストール
3. localhost用の証明書を作成し、`webapp/server/certs` に配置

例:

- `mkcert -install`
- `mkcert -cert-file webapp/server/certs/localhost.pem -key-file webapp/server/certs/localhost-key.pem localhost`

起動:

- `pnpm dev:https`

補足:

- `BETTER_AUTH_URL` は `https://localhost:3000` に合わせる（[webapp/server/.env](webapp/server/.env)）。
- MetaのリダイレクトURIは `https://localhost:3000/api/auth/callback/instagram` に設定。
- 既定の証明書パスは `webapp/server/certs/localhost.pem` と `webapp/server/certs/localhost-key.pem`。
- 変更したい場合は `HTTPS_CERT_FILE` / `HTTPS_KEY_FILE` / `HTTPS_PORT` / `HTTPS_HOST` を指定。

## ビルド

- Next.js: `pnpm build`

## コード品質

### Pre-commit Hooks

このプロジェクトでは、コミット前に自動でコードフォーマットとlintを実行する pre-commit hooks を設定しています。

#### 自動実行される内容

- **TypeScript/JavaScript ファイル** (`.ts`, `.tsx`, `.js`, `.jsx`):
  - ESLint による自動修正 (`eslint --fix`)
  - Prettier によるフォーマット (`prettier --write`)

- **その他のファイル** (`.json`, `.md`, `.css`, `.html`, `.yml`, `.yaml`):
  - Prettier によるフォーマットのみ (`prettier --write`)

#### セットアップ

初回の `pnpm install` 時に自動でセットアップされます。手動でセットアップする場合:

```bash
pnpm install
pnpm run prepare
```

#### 動作

`git commit` を実行すると、ステージされたファイルに対して自動的にlint/formatが実行されます。
エラーがある場合は自動修正され、修正後のファイルがコミットに含まれます。

#### 手動実行

pre-commit hook を通さずに手動でlint/formatを実行する場合:

```bash
# すべてのファイルをlint
pnpm lint

# すべてのファイルをformat
pnpm format

# formatのチェックのみ（修正なし）
pnpm format:check
```

## E2E（Playwright）

- デフォルトの baseURL: `http://localhost:3000`
- 本番/ステージングでは `PLAYWRIGHT_BASE_URL` を指定します。
  - 例: `PLAYWRIGHT_BASE_URL=https://example.com pnpm test:e2e`
- ローカル実行時はテスト前に Next dev サーバが自動起動されます。

## 環境変数

- `PLAYWRIGHT_BASE_URL`（任意）: E2E対象URL
- `BETTER_AUTH_SECRET`: Better Authのシークレット
- `BETTER_AUTH_URL`: Better AuthのBase URL（例: https://localhost:3000）
- `INSTAGRAM_CLIENT_ID`: Instagram OAuth Client ID
- `INSTAGRAM_CLIENT_SECRET`: Instagram OAuth Client Secret
- `BETTER_AUTH_DB_PATH`（任意）: SQLite DBパス

## Instagram API（Instagramログイン）

本プロジェクトは「Instagramログインを使ったInstagram API」に対応しています。

準備:

1. Meta DevelopersでInstagramログインを有効化
2. Instagramビジネス/クリエイターアカウントであることを確認
3. OAuthリダイレクトURIを設定
   - `https://localhost:3000/api/auth/callback/instagram`
4. App ID/Secretを `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET` に設定

使用スコープ:

- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`
