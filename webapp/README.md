# Webapp

## 開発

- Next.js（HTTPS）: `pnpm dev`

### HTTPS（mkcert）セットアップ

Instagram OAuth はローカル開発でも HTTPS が必須となります。

1. mkcertをインストール（未導入の場合: `brew install mkcert`）
2. ローカル認証局のインストール: `mkcert -install`
3. localhost用の証明書を作成し、`webapp/certs` に配置:

   ```bash
   mkdir -p certs
   mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem localhost
   ```

4. 開発サーバーの起動:
   ```bash
   pnpm dev
   ```
   ブラウザで `https://localhost:3000` にアクセスします。

補足:

- `BETTER_AUTH_URL` は `https://localhost:3000` に設定します（`.env.local`）。
- Meta for Developers の「有効なOAuthリダイレクトURI」には `https://localhost:3000/api/auth/oauth2/callback/instagram` を登録します。
- 既定の証明書パスは `webapp/certs/localhost.pem` と `webapp/certs/localhost-key.pem` です。
- 証明書パスを変更したい場合は `HTTPS_CERT_FILE` / `HTTPS_KEY_FILE` / `HTTPS_PORT` / `HTTPS_HOST` を指定可能です。

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

## 環境変数設定 (`webapp/.env.local`)

プロジェクト直下の `webapp/.env.local` に以下の内容を設定します（※ `webapp/src/.env.local` ではないので注意）。

```env
# Meta Developers（Instagram API 設定）のクレデンシャル
INSTAGRAM_CLIENT_ID=あなたのInstagramアプリID
INSTAGRAM_CLIENT_SECRET=あなたのInstagramアプリシークレット

# Better Auth の設定
BETTER_AUTH_SECRET=32文字以上のランダム文字列（例: openssl rand -base64 32 で生成）
BETTER_AUTH_URL=https://localhost:3000
```

### 各環境変数の取得元・設定方法

| 環境変数名                | 取得元 / 画面パス                                                                                               | 説明・注意点                                                                                                                                                                                                                         |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INSTAGRAM_CLIENT_ID`     | [Meta for Developers](https://developers.facebook.com/apps/) ➔ アプリ選択 ➔ 左メニュー「Instagram」➔「API設定」 | **Instagram アプリ ID**（数値）。<br>⚠️ 親の Meta (Facebook) アプリID（「アプリの設定」➔「ベーシック」に表示されるID）を設定すると `Invalid platform app` エラーになります。必ず **Instagram API 設定側** の ID を設定してください。 |
| `INSTAGRAM_CLIENT_SECRET` | 同上（「Instagram」➔「API設定」）                                                                               | **Instagram アプリシークレット**。「表示」を押してパスワードを入力しコピーします。                                                                                                                                                   |
| `BETTER_AUTH_SECRET`      | ローカルで生成                                                                                                  | ターミナルで `openssl rand -base64 32` を実行して得られた文字列を設定します。                                                                                                                                                        |
| `BETTER_AUTH_URL`         | ローカル固定値 / 本番URL                                                                                        | ローカル時は `https://localhost:3000`。<br>Vercel 本番時はデプロイ先ドメイン（例: `https://your-app.vercel.app`）。                                                                                                                  |

---

## Meta for Developers（Instagram ログイン）セットアップ手順

数ヶ月後や別環境で再度セットアップする際の手順です：

### 1. アプリの前提条件

- [Meta for Developers](https://developers.facebook.com/apps/) でアプリを作成（タイプは **ビジネス (Business)** を推奨）。
- 左メニュー「ユースケース」または「製品」から **Instagram（Instagram API with Instagram Login）** を追加。

### 2. リダイレクト URI の登録

以下の両方の画面で、有効な OAuth リダイレクト URI に `https://localhost:3000/api/auth/oauth2/callback/instagram` を追加して「変更を保存」します：

1. **Instagram API 設定**: 左メニュー「Instagram」➔「API設定」➔「有効なOAuthリダイレクトURI」
2. **Facebook ログイン設定**: 左メニュー「Facebookログイン」➔「設定」➔「有効なOAuthリダイレクトURI」
   _(※ Vercel 本番環境の場合は `https://<本番ドメイン>/api/auth/oauth2/callback/instagram` も登録)_

### 3. Instagram アカウントの準備（重要）

- **プロアカウント必須**: ログインに使用する Instagram アカウントは、通常の個人用アカウントではなく **プロアカウント（クリエイター または ビジネス）** である必要があります（Instagram スマホアプリの設定 ➔「アカウントの種類とツール」➔「プロアカウントに切り替える」から無料で即座に切替可能）。
- **テスター登録（開発モード時）**:
  - Meta Developers の左メニュー「アプリの役割」➔「役割」➔「Instagramテスター」にログインする Instagram ユーザー名を追加。
  - Instagram側（Webまたはアプリの 設定 ➔「ウェブサイトのアクセス許可」➔「アプリとウェブサイト」➔「テスターへの招待」）で承認。

---

## 開発サーバーの起動

1. **HTTPS 証明書（初回のみ）**:
   ```bash
   # mkcert が未導入の場合: brew install mkcert
   mkcert -install
   mkdir -p certs
   mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem localhost
   ```
2. **起動**:
   ```bash
   cd webapp
   pnpm dev
   ```
3. ブラウザで **`https://localhost:3000`** にアクセスし、「Instagramでログイン」を実行します。
