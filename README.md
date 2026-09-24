# instagram-feed-epublisher

Instagram の投稿を収集・フィルタリングし、EPUB（電子書籍）としてまとめてダウンロードできる Web アプリケーションです。
Next.js (App Router) + TypeScript + Better Auth を採用し、同一オリジンでセキュアに UI と API（フィード取得・EPUB 生成）を提供します。

---

## 1. このリポジトリで管理しているもの

- **Web アプリケーション本体 (`webapp/`)**: Next.js (App Router) によるフロントエンド、Better Auth を用いた Instagram SSO、フィード取得・EPUB 生成 API Route。
- **EPUB レイアウトテンプレート (`book_layout/`)**: 電子書籍のスタイル（CSS）および HTML テンプレート。
- **設計・運用ドキュメント (`docs/`)**: 要件定義、アーキテクチャ、データフロー、ER図・フローチャート等の設計資産（`docs/designdoc/`）およびドキュメント更新ポリシー。
- **プロジェクト共通スクリプト (`scripts/`)**: Mermaid 図面検証等のリポジトリ共通スクリプト。
- **CI/CD ワークフロー (`.github/workflows/`)**: GitHub Actions によるコード・Markdown・Mermaid・型・テストの総合自動検証。

---

## 2. ディレクトリ構成

```text
.
├── .github/              # GitHub Actions CI ワークフロー、エージェント向け指示定義
├── book_layout/          # EPUB 生成時の HTML / CSS レイアウトテンプレート
├── docs/                 # 設計資産・ドキュメント更新ポリシー
│   ├── designdoc/        # 設計ドキュメント・Mermaid 図面
│   │   ├── designDoc.md      # Webapp 詳細設計書
│   │   ├── erDiagram.mmd     # データモデル・ER図
│   │   ├── flowchart LR.mmd  # ユーザーフロー図
│   │   └── sequenceDiagram.mmd # 認証・API連携シーケンス図
│   └── documentation-policy.md # ドキュメント更新ポリシー
├── scripts/              # リポジトリ共通チェックスクリプト
└── webapp/               # Next.js Web アプリケーション本体（※詳細は webapp/README.md 参照）
```

> [!TIP]
> `webapp/` 配下の詳細なディレクトリ構成やコンポーネント配置については、[webapp/README.md](webapp/README.md) を参照してください。

---

## 3. アプリ・設計概要ドキュメント

システムの設計思想、データモデル、認証・通信フロー、運用の詳細は以下のドキュメントを参照してください：

- 📘 [Webapp 詳細設計書](docs/designdoc/designDoc.md)
  - 目的・要件、モジュール構成、技術選定の経緯（Vite から Next.js への移行、Instagram Login 対応）、トラブルシューティング。
- 🔀 [ユーザーフロー図 (Mermaid)](docs/designdoc/flowchart%20LR.mmd)
  - ログインから条件指定、フィード取得、EPUB ダウンロードまでの全体フロー。
- 🗂 [データモデル・ER図 (Mermaid)](docs/designdoc/erDiagram.mmd)
  - ユーザー、アカウント、セッション、Instagram メディア等の関連図。
- 🔄 [処理シーケンス図 (Mermaid)](docs/designdoc/sequenceDiagram.mmd)
  - Next.js フロントエンド、Better Auth、Instagram Graph API 間の認証・データ取得シーケンス。
- 📜 [ドキュメント更新ポリシー](docs/documentation-policy.md)
  - 人間および AI エージェントが遵守すべきドキュメント配置、更新義務、品質基準（Markdown / Mermaid の検証ルール）。

---

## 4. 前提環境

開発を始めるにあたり、以下の環境・アカウントが必要です：

### 開発ツール・ランタイム

- **Node.js**: `>= 24.12.0`（リポジトリ直下の `.node-version` 準拠）
- **パッケージマネージャー**: `pnpm` (`10.x`)
- **[mkcert](https://github.com/FiloSottile/mkcert)**: ローカル開発環境で HTTPS を有効化するために必要（Instagram OAuth は HTTPS が必須）

### 外部アカウント・権限

- **[Meta for Developers](https://developers.facebook.com/apps/) アカウント**:
  - アプリタイプ「ビジネス (Business)」でアプリを作成し、「Instagram（Instagram API with Instagram Login）」を追加できること。
- **Instagram プロアカウント**:
  - ログインに使用するアカウントは、通常の個人用アカウントではなく **プロアカウント（ビジネスまたはクリエイター）** である必要があります（Instagram アプリから無料で切替可能）。

---

## 5. セットアップ & 開発手順

### ステップ 1: 依存関係のインストール

```bash
cd webapp
pnpm install
```

### ステップ 2: ローカル HTTPS 証明書の作成 (mkcert)

Instagram OAuth では、ローカル開発環境（localhost）であっても HTTPS 通信が必須となります。

```bash
# mkcert が未導入の場合 (macOS 例)
brew install mkcert

# ローカル認証局のインストール（初回のみ）
mkcert -install

# webapp/certs に localhost 用証明書を生成
cd webapp
mkdir -p certs
mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem localhost
```

### ステップ 3: Meta for Developers（Instagram ログイン）の設定

1. **アプリ作成**:
   - [Meta for Developers](https://developers.facebook.com/apps/) にアクセスし、アプリを作成します（タイプは **ビジネス** を推奨）。
   - 左メニューから「Instagram（Instagram API with Instagram Login）」を追加します。
2. **有効な OAuth リダイレクト URI の登録**:
   以下の両方の画面で、`https://localhost:3000/api/auth/oauth2/callback/instagram` を追加して保存します：
   - 「Instagram」➔「API設定」➔「有効なOAuthリダイレクトURI」
   - 「Facebookログイン」➔「設定」➔「有効なOAuthリダイレクトURI」
3. **Instagram テスターの追加（開発モード時）**:
   - Meta Developers の左メニュー「アプリの役割」➔「役割」➔「Instagramテスター」に、ログインに使用する Instagram アカウントを追加します。
   - Instagram 側（Web またはアプリの 設定 ➔「ウェブサイトのアクセス許可」➔「アプリとウェブサイト」➔「テスターへの招待」）で招待を承認します。

### ステップ 4: 環境変数の設定 (`webapp/.env.local`)

`webapp/.env.local` ファイルを作成し、以下の値を設定します：

```env
# Meta Developers（Instagram API 設定）のクレデンシャル
INSTAGRAM_CLIENT_ID=あなたのInstagramアプリID
INSTAGRAM_CLIENT_SECRET=あなたのInstagramアプリシークレット

# Better Auth の設定
BETTER_AUTH_SECRET=32文字以上のランダム文字列（例: openssl rand -base64 32 で生成）
BETTER_AUTH_URL=https://localhost:3000

# 法的ページ等のお問い合わせ窓口フォーム（任意・未設定時は GitHub Issues）
# NEXT_PUBLIC_CONTACT_FORM_URL=https://forms.gle/xxxxxx
```

#### 各環境変数の取得元・注意点

| 環境変数名                     | 取得元 / 設定方法                                                                                | 説明・注意点                                                                                                                                                                                                        |
| :----------------------------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `INSTAGRAM_CLIENT_ID`          | [Meta for Developers](https://developers.facebook.com/apps/) ➔ アプリ ➔「Instagram」➔「API設定」 | **Instagram アプリ ID**（数値）。<br>⚠️ 親の Meta (Facebook) アプリID（「ベーシック」に表示されるID）を設定すると `Invalid platform app` エラーになります。必ず **Instagram API 設定側** の ID を指定してください。 |
| `INSTAGRAM_CLIENT_SECRET`      | 同上（「Instagram」➔「API設定」）                                                                | **Instagram アプリシークレット**。「表示」を押してコピーします。                                                                                                                                                    |
| `BETTER_AUTH_SECRET`           | ローカルで生成                                                                                   | ターミナルで `openssl rand -base64 32` を実行して得られた文字列を設定します。                                                                                                                                       |
| `BETTER_AUTH_URL`              | 固定値                                                                                           | ローカル開発時は `https://localhost:3000` を設定します。                                                                                                                                                            |
| `NEXT_PUBLIC_CONTACT_FORM_URL` | Googleフォーム等のURL（任意）                                                                    | 法的・ポリシーページに表示するお問い合わせフォームのURL。未設定時はリポジトリの GitHub Issues がフォールバックされます。                                                                                            |

### ステップ 5: 開発サーバーの起動

開発サーバーの起動方法は、**ローカル環境（ホスト）直実行** または **Docker Compose** のいずれかを選択できます。どちらも HTTPS（`https://localhost:3000`）およびホットリロード（Fast Refresh）に対応しています。

#### パターン A: ローカル環境で直接起動

```bash
# プロジェクトルートから実行
pnpm dev
```

#### パターン B: Docker Compose で起動（推奨）

コンテナ内で隔離された Node.js 24 環境で起動します。ホスト側のソースコード変更が即座にホットリロードされます。

```bash
# プロジェクトルートから実行
docker compose up
```

起動後、ブラウザで **`https://localhost:3000`** にアクセスし、「Instagramでログイン」から動作確認を行ってください。

---

## 6. コード品質と開発コマンド

### Pre-commit Hooks

このリポジトリでは Husky + lint-staged を設定しており、コミット時にステージされたファイルに対して自動的にフォーマットと検証が実行されます：

- **TypeScript / JavaScript** (`*.{js,jsx,ts,tsx}`): `oxlint --fix` による静的解析自動修正 ＋ `oxfmt --write` によるコード整形
- **Markdown** (`*.md`): `oxfmt --write` による整形 ＋ `markdownlint-cli2 --fix` による構文チェック・自動修正
- **Mermaid 図面** (`*.mmd`): `scripts/check-mermaid.mjs`（`mmdc`）による構文解析・画像変換検証
- **Terraform** (`*.tf`): `terraform fmt` によるインフラコードの自動整形

### 主な開発コマンド

すべてのコマンドは **プロジェクトルート** から直接実行できます：

```bash
# 開発サーバー起動 (HTTPS: https://localhost:3000)
pnpm dev

# Next.js ビルドキャッシュ (.next) の削除
pnpm clean

# 本番用ビルド（クリーンビルドは pnpm build:clean）
pnpm build

# コードの Lint 実行 (oxlint)
pnpm lint

# Markdown の Lint 実行 (markdownlint-cli2)
pnpm lint:md

# Markdown の Lint 自動修正
pnpm lint:md:fix

# コード・Markdown のフォーマット実行 (oxfmt)
pnpm format
pnpm format:check

# Mermaid 図面の変換チェック (mmdc)
pnpm check:mermaid

# Terraform のフォーマット・構文検証
pnpm terraform:fmt
pnpm terraform:fmt:check
pnpm terraform:validate

# 単体テスト (Vitest)
pnpm test

# E2E テスト (Playwright ※現在整備中)
pnpm e2etest
```

---

## 7. 今後やりたいこと (Roadmap / TODO)

- [ ] **Playwright による E2E テストの本格整備**
  - 現在は SSO ボタンの表示確認（`webapp/e2e/sso-button.spec.ts`）のみ存在しています。
  - 今後、認証フローのモック検証、および「ログイン ➔ 投稿取得・条件フィルタ ➔ EPUB 生成・ダウンロード」までの一連のユーザー体験を自動テストする E2E スイートを構築予定です。
- [ ] **EPUB 生成プレビュー・プログレス表示の向上**
  - 多数の画像を含む投稿の取得・変換時の進捗状況（プログレスバー）やエラーハンドリングの強化。
- [x] **本番デプロイ環境の整備（Google Cloud Run）**
  - Docker マルチステージビルド、Secret Manager、Workload Identity Federation による自動 CI/CD を構築済み。

---

## 8. 本番運用・デプロイ (Google Cloud Run)

本番環境は **Google Cloud Run**（東京リージョン: `asia-northeast1`）で運用され、独自ドメイン **`https://feedstobook.ksanchu.info`** で公開されます。

### 特徴

- **ゼロスケール運用**: リクエストがない待機時はインスタンス数を 0 に保ち、運用コストを最小化。
- **キーレス CI/CD**: Workload Identity Federation (OIDC) を利用し、永続的なサービスアカウントキーを発行せずに GitHub Actions から自動デプロイ。
- **Secret Manager 連携**: Instagram API キーやセッション暗号化鍵などの機密情報を安全に注入。

### 詳細な環境構築・リソース設定手順

GCP プロジェクト作成、Artifact Registry、Secret Manager、WIF 設定、独自ドメインマッピング（DNS）の完全な手順は以下を参照してください：

- 📖 [Google Cloud & CI/CD 環境構築手順書 (docs/gcp-setup.md)](docs/gcp-setup.md)
