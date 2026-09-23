# 学びと知見 (Lessons Learned)

## ドキュメント管理

- **モノレポ/サブディレクトリからの集約**:
  - CLI や過去のアーキテクチャの名残でサブディレクトリ（`webapp/`）に手順や環境構築情報が集約されていた場合、リポジトリルートの `README.md` を総合ポータル化し、サブディレクトリ側は固有のコンポーネント構成やコマンド一覧に絞ることで二重管理や情報の陳腐化を防げる。
- **資産の可視化**:
  - `designdoc/` や Mermaid 図（ER図、フローチャート、シーケンス図）など、リポジトリ内の設計資産へのリンクをルート `README.md` に明記することで、後から参加する開発者や数ヶ月後の自分へのオンボーディングコストを大幅に下げられる。

## 開発ツール・フォーマッター / リンター

- **oxfmt と markdownlint-cli2 の併用**:
  - `oxfmt` はレイアウト・インデント・空白のコード整形を担当し、`markdownlint-cli2` は見出しやリストの前後空行などの Markdown 構文規則（ASTレベル）の品質を担保する。両方を組み合わせることで美しいドキュメントを自動維持できる。
- **Mermaid の構文・レンダリング検証 (mmdc)**:
  - `@mermaid-js/mermaid-cli` はヘッドレスブラウザ（Puppeteer）を利用するため、CI（Linuxコンテナ環境）で実行する際は `--no-sandbox` 引数を渡すラッパースクリプトを用意する。また、GitHub-hosted runner (ubuntu-latest) には `/usr/bin/google-chrome` が標準装備されているため、`PUPPETEER_EXECUTABLE_PATH` として指定することで、CI 上での追加ブラウザダウンロード不要で高速・安定動作する。
- **ルート package.json によるコマンド集約**:
  - ワークスペース構成を採用し、共通開発ツール（lint, format, mermaid check等）をルートの `devDependencies` に配置することで、プロジェクトルートから `pnpm <command>` で直感的に全ての操作を実行できるようになる。
- **依存関係のピン留め**:
  - 活発に破壊的変更が行われるライブラリ（Better Auth 等）は、キャレット（`^`）ではなくバージョンを固定（ピン留め）しておくことで、意図しない型エラーやプラグイン構造の変更によるビルド破損を防止できる。

## CI/CD ワークフロー設計

- **ジョブの責務分離と明確な命名**:
  - CIジョブに `quality` などの抽象的な名称を使用すると、何が失敗したのかPRのチェック画面から直感的に判断しづらくなる。
  - ドキュメント検証（Markdown lint / Format / Mermaid check）を `Document check`、Webアプリ検証（Code lint / Type check / Unit tests）を `Webapp check` のように関心ごとに分割して並列実行することで、失敗原因の切り分けが迅速化され、可視性と保守性が向上する。

## フロントエンド基盤・Tailwind CSS v4

- **Tailwind CSS v4 + Next.js 15 の導入構成**:
  - Tailwind CSS v4 では `@tailwindcss/postcss` を PostCSS プラグインとして指定し、CSS ファイル冒頭で `@import "tailwindcss";` を宣言する構成が標準的かつシンプル。
  - iOS セーフエリア（`env(safe-area-inset-*)`）やモバイルビューポート（`100dvh`）などの固有ユーティリティは、Tailwind v4 の `@utility` ディレクティブを用いて CSS 内で宣言的に定義できる。
  - Tailwind v4 のオンデマンドコンパイラは、ソースコード内で実際に使用されたユーティリティクラスのみを CSS バンドルに出力するため、出力検証時はクラスの適用状態を意識する必要がある。
- **アイコンライブラリの選定と注意点 (Lucide Icons)**:
  - `lucide-react` は UI/ナビゲーション用の汎用アイコン（`BookOpen`, `Filter`, `Check` 等）が充実している一方、Instagram や Facebook 等の企業/ブランドロゴは意図的に含まれていないため、ブランドアイコンにはカスタム SVG コンポーネントを用意するなどの使い分けが適している。

## 認証・バックエンド連携

- **Better Auth API のリクエストスキーマ**:
  - `auth.api.getAccessToken` をサーバー側で呼び出す際は、クエリパラメータ（`params`）ではなく `{ body: { providerId: string } }` の形式でプロバイダIDを渡す必要がある。スキーマと異なる引数を渡すとバリデーションエラーとなり、API呼び出しが失敗する。
- **Better Auth の完全ステートレス化（DBレス化）**:
  - Cloud Run などのゼロスケール・コンテナ環境では、ローカル SQLite（`better-auth.db`）を使用するとインスタンス停止・再起動でセッションが消失する。
  - `betterAuth` から `database` オプションを削除し、`account: { storeAccountCookie: true }` を有効化することで、OAuth トークン情報が暗号化 Cookie（`account_data`）に保存される。
  - サーバー側でアクセストークンを取得する際は、`auth.api.getAccessToken` の `body` に `{ providerId: "instagram", useAccountCookie: true }` を渡すことで、暗号化 Cookie から安全にトークンを復号・取得できる。
  - DB が不要になることで `better-sqlite3` などのネイティブバイナリ依存やマイグレーション（`auth:migrate`）が撤廃され、コンテナビルドの高速化・ポータビリティ向上にも寄与する。

## ネイティブアドオンと Node.js バージョン整合性 (過去の知見・撤廃済み)

- **ABI 不一致とリビルド**:
  - `better-sqlite3` などのネイティブアドオンを含む場合、ビルド時と実行時の Node.js バージョン（ABI）が異なると `ERR_DLOPEN_FAILED` が発生する。モノレポ環境ではルート直下での `pnpm rebuild <pkg>` がスキップされる場合があるため、対象パッケージのスコープを指定して `pnpm --filter <workspace> rebuild <pkg>` を実行する必要があった（※本プロジェクトではステートレス化により `better-sqlite3` は撤廃済み）。
- **pnpm で不要な optional peerDependencies を除外する overrides**:
  - `auto-install-peers=true`（pnpm のデフォルト動作）の環境では、ライブラリ（Better Auth 等）が宣言している optional peerDependencies（`better-sqlite3` 等）が自動的に解決・インストールされ、lockfile やコンテナ環境に残存してしまう場合がある。
  - ルート `package.json` の `pnpm.overrides` に `"package-name": "-"` を指定することで、依存関係グラフから対象パッケージを完全に除外・無効化できる。

## テスト実行基盤 (Vitest & React 19)

- **Node.js 環境下での React 19 JSX トランスパイル**:
  - `environment: "node"` で React コンポーネントを静的レンダリング（`renderToStaticMarkup` 等）してテストする場合、esbuild の JSX トランスパイル設定（`jsx: "automatic"`）に加えて、`vitest.setup.ts` で `globalThis.React = React` を補完しておくことで、テストコードおよびインポート先モジュール内での `ReferenceError: React is not defined` を回避し、外部DOMライブラリ非依存の軽量かつ高速な単体テストを実現できる。
