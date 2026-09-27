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

## Meta アプリ審査・法的ページ設計

- **審査向け内部文言の排除**:
  - 法的ページ（プライバシーポリシー、利用規約、データ削除手順）に「Meta 審査対応」などの開発者向けラベルや「Meta の要件に対応するため」といったメタ発言を残すと、審査員から「本番運用を意図しない一時的な仮設モック」と判断されリジェクトの要因になり得る。常にエンドユーザー目線の公式文書として記述する。
- **問い合わせ窓口の柔軟性と環境変数化**:
  - 連絡窓口を GitHub Issues に限定すると、GitHub アカウントを持たない一般利用者から連絡を受け付けられないと審査員に指摘されるケースがある。Googleフォーム等の汎用フォームを用意し、環境変数（`NEXT_PUBLIC_CONTACT_FORM_URL`）経由で差し替え可能に設計することで、開発・本番の切り替えや運用変更に柔軟に対応できる。
- **Next.js App Router における静的ページの配信**:
  - 動的関数を使用しない Server Component は、ビルド時に自動的に静的HTML（Static Rendering）として事前生成される。クローラーやボットがアクセスした際も初回から完全なHTMLが即時返却されるため、Meta審査のボット巡回やSEO、表示パフォーマンスのすべてにおいて最適となる。

## コンテナ化・Cloud Run デプロイ・Docker 開発基盤

- **Next.js 15 standalone 出力とモノレポ構成**:
  - `pnpm` ワークスペース（モノレポ）構成下では、`next.config.mjs` で `output: "standalone"` に加えて `outputFileTracingRoot: path.resolve(__dirname, "..")`（リポジトリルート）を指定することで、親ディレクトリの lockfile や共有設定が正しくトレースされ、`.next/standalone` 配下に完全な実行ファイル群が生成される。
  - 静的アセット（`.next/static`）および `public` ディレクトリは standalone 出力に自動コピーされないため、Dockerfile の runner ステージで明示的に `COPY` する必要がある。また `public` ディレクトリが存在しない場合のビルド失敗を防ぐため、`.gitkeep` やワイルドカード（`public*`）による防御的コピーが有効。
- **Docker ローカル開発におけるホットリロードとボリューム分離**:
  - ホスト側ソースコードをバインドマウント（`-v .:/app`）する際、ホスト（macOS）の `node_modules` や `.next` でコンテナ内（Linux）の依存関係が上書きされないよう、匿名ボリューム（`/app/node_modules`, `/app/webapp/node_modules`, `/app/webapp/.next`）で保護する。
  - macOS の Docker Desktop 上でのファイル変更検知を安定させるため `WATCHPACK_POLLING=true` を指定し、HTTPS 開発サーバーではコンテナ外（ホストブラウザ）からの接続を許可するため `HTTPS_HOST=0.0.0.0` にバインドする。
- **Google Cloud Run へのキーレス CI/CD (Workload Identity Federation)**:
  - 永続的なサービスアカウントキー（JSON）を発行せず、GitHub Actions の OIDC トークンと GCP Workload Identity Pool を連携させることで、鍵漏洩リスクを排除したセキュアな自動デプロイを実現できる。
  - 機密情報（Instagram クレデンシャルやセッション暗号化鍵）は Secret Manager で集中管理し、Cloud Run のデプロイフラグ（`--set-secrets`）で環境変数としてセキュアに注入する。
- **コンテナ内での Playwright Chromium の動作要件と日本語フォント**:
  - Alpine Linux では musl libc の制約により Playwright 公式の Chromium バイナリが動作しないため、Debian (`node:24-bookworm-slim`) をベースイメージとして採用する。
  - Dockerfile 内で `npx -y playwright@<version> install --with-deps chromium` を実行して Chromium ヘッドレスバイナリと共有ライブラリをプリインストールし、表紙レンダリング時の日本語文字化け（豆腐）を防ぐため `fonts-noto-cjk` を同時に導入する。
  - コンテナ内で Chromium を起動する際は、sandbox 権限エラーや共有メモリ不足を防ぐため `args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]` を指定する。
- **Next.js の公開環境変数（NEXT_PUBLIC\_*）とコンテナビルド時の注意点**:
  - `NEXT_PUBLIC_*` プレフィックスの環境変数は、Next.js のビルド時（`next build`）に Webpack / Turbopack の DefinePlugin によりクライアントバンドルおよび静的生成（SSG）ページ内にインライン展開（ハードコード）される。
  - 実行時（Cloud Run 起動時や Secret Manager マウント）に注入しても、クライアントバンドルや SSG 成果物には反映されず、コード上のデフォルトフォールバック値が固定化されてしまう。
  - お問い合わせフォーム URL のような公開設定は機密情報（Secret）ではないため、Secret Manager ではなく GitHub Actions の Repository Variables（`vars`）から Dockerfile の `ARG` / `ENV` を通じてビルド時に埋め込むのが適切な設計である。
- **CI/CD デプロイ用サービスアカウントの最小権限（Least Privilege）徹底**:
  - Workload Identity Federation で GitHub Actions に権限を付与する際、デプロイヤ SA に不要な権限（Secret Manager の Secret Accessor など）を付与しない（実行時にシークレットを読むのは Cloud Run ランタイム SA であるため）。
  - 特に `roles/iam.serviceAccountUser`（サービスアカウントの借用権限）をプロジェクト全体（`google_project_iam_member`）で付与すると、プロジェクト内のあらゆるサービスアカウント（Default Compute SA 等）になりすませる過剰権限となる。
  - デプロイ対象の Cloud Run サービスに指定するランタイム SA（`feedstobook-runner`）に対してのみリソースレベル（`google_service_account_iam_member`）で `roles/iam.serviceAccountUser` をスコープ限定して付与することで、強固な最小権限モデルを実現できる。

## API ペイロード設計と階層構造のフォールバック

- **ネストされたメタデータとトップレベルプロパティの乖離防止**:
  - `coverTheme` や `sortOrder` のような設定項目が、UIステート・リクエストボディのトップレベル・ネストされた `metadata` や `filter` に分散して存在する場合、受け渡しレイヤーごとに参照先が異なるとサイレントにデフォルト値へフォールバックするバグが発生しやすい。
  - サーバー側バリデーション（`validatePayload`）やビルダー関数（`buildEpub`）では、トップレベルとネストされたプロパティの双方（`value.coverTheme ?? value.metadata?.coverTheme`）を適切にフォールバック解決する耐障害性を持たせる。
  - フロントエンド側でも型定義に沿ってトップレベルおよびネスト双方で確実に値を送信し、デモ用API（`/api/epub/demo`）と本番用API（`/api/epub`）で引数取り扱いの乖離を作らないように一貫したテストを作成することが重要である。
- **データ変換処理（並び替え等）の責務一本化**:
  - API ハンドラ側で事前ソートを行い、下流のビルダー関数（`buildEpub`）でも再度ソートを行うような二重処理は、冗長であるだけでなく、それぞれの並び替え仕様や不正値ハンドリングに将来的な乖離が生じた際に予期せぬ不整合を招く。データ変換処理の責務は下流のビルダー関数側に集約・一本化することが望ましい。
- **型アサーションとフォールバック実装の整合**:
  - リクエストボディの型アサーションでプロパティを必須（`items: InstagramMedia[]`）と定義しながら、実装上で未指定時のフォールバック（`payload.items?.length ? ... : fallback`）を行っていると型と実装の乖離が生じる。省略を許容する項目は型定義上もオプショナル（`items?: InstagramMedia[]`）に揃えることで、安全なリファクタリングを担保できる。

## Cloud Run / リバースプロキシ環境と Next.js Middleware のリダイレクト設計

- **Cloud Run のプロキシヘッダーと Next.js のホスト解決**:
  - Cloud Run では、Google Frontend（GFE）からコンテナインスタンス（ポート 8080）へリクエストを転送する際、コンテナに届く `Host` ヘッダーは内部サービスホスト（`*.run.app` や `localhost` 等）になる。クライアントが実際にアクセスした外部ドメインは `X-Forwarded-Host` ヘッダーに格納される。
  - Next.js の `request.nextUrl.hostname` は HTTP の `Host` ヘッダーを参照するため、Cloud Run 上ではクライアントのアクセスドメインと一致しない。独自ドメインへの正規化判定（Canonical Host 判定）では、`request.headers.get("x-forwarded-host")?.split(",")[0].trim().split(":")[0]` を優先して解決する必要がある。
- **WHATWG URL 仕様における既存ポートの残留と安全なリダイレクト URL 構築**:
  - Next.js コンテナがポート 8080 でリッスンしている場合、`nextUrl` の内部ポートは `"8080"` となる。
  - JavaScript の WHATWG URL 仕様では、ポートが存在する URL オブジェクトに対して `url.host = "canonical.domain"` とポート無しの値を代入しても、**既存の `port` はクリアされず保持される**ため、`canonical.domain:8080` が生成されてしまう。
  - GFE はポート 8080 での外部アクセスを受け付けないため、アクセス不能（タイムアウト/接続拒否）の原因となる。
  - リダイレクト先 URL を生成する際は、`nextUrl.clone()` を安易に使わず、`new URL(request.nextUrl.pathname + request.nextUrl.search, "https://" + CANONICAL_HOST)` でプロトコルとホストを明示して新規構築するか、`redirectUrl.port = ""` を明示的に指定してポート番号の混入を根絶する。

## Next.js Standalone ビルドと CI/CD デプロイ運用

- **Next.js Standalone ビルドにおける動的非 JS アセット（Playwright `browsers.json`）の欠落対策**:
  - Playwright はブラウザ管理情報を動的に読み込むため、Next.js の `output: "standalone"` による静的依存追跡（`@vercel/nft`）で `node_modules/playwright-core/browsers.json` がバンドル対象外となり、コンテナ起動後の Playwright 呼び出し時に `Cannot find module .../browsers.json`（HTTP 500）が発生する。
  - 対策として、`next.config.mjs` の `serverExternalPackages` への指定と同時に、Dockerfile の runner ステージで `builder` から `browsers.json` を standalone 環境の `node_modules` パス（`.pnpm/playwright-core@<version>/node_modules/playwright-core/browsers.json` および `playwright-core/browsers.json`）に明示的に COPY 配置する。
- **独自ドメイン正規化（Canonical Host Redirect）下での CI/CD デプロイヘルスチェック**:
  - 本番アプリで非正規ホスト（`*.run.app` 等）から独自ドメインへの 301 リダイレクトを行う場合、CI/CD ワークフローで Cloud Run サービス URL（`*.run.app`）を直接 curl すると `301` が返り、HTTP 200 判定のヘルスチェックがタイムアウト失敗する。
  - `curl -L`（`--location`）を付与してリダイレクトを追従させ、最終転送先の 200 OK を検証するようにヘルスチェックを設計する。
