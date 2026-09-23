# Webapp設計ドキュメント

## 1. 目的・背景

- Instagramの投稿を取得し、EPUBとしてまとめてダウンロードできるWeb UIを提供する。
- 認証はInstagram Login（Instagram API with Instagram Login）を使用し、同一オリジンでAPIとUIを運用する。

## 2. プロダクトのポリシー

本アプリが出力する電子書籍（EPUB）の価値は、**「著者がInstagramに投稿した表現・記録そのもの（写真やキャプション文章）」** にある。
Instagramのプラットフォームの仕組みによって外的に付与された数値情報（いいね数、インプレッション数、フォロワー数など）は、著者の創作や記録という本本来の価値とは異なるため、**生成されるEPUB書籍には一切含めない（出力しない）**。
※Web UIの一覧表示において、ユーザーが投稿を選定・確認するための参考情報として表示することは許容するが、電子書籍への書き出し対象からは厳密に除外する。

## 3. 要件

### 3.1 機能要件

- Instagramログイン（OAuth）
- 自分の投稿（メディア）の取得
- フィルタ（ハッシュタグ/期間/件数）
- EPUB生成とダウンロード
- ログアウト

### 3.2 非機能要件

- 同一オリジンでUI/APIを提供すること
- HTTPS必須（Meta側の要件に対応）
- ローカル開発でもHTTPSで検証可能
- 最小限の依存で運用を簡潔化

### 3.3 外部サービス要件

- Instagram Login（Instagram API with Instagram Login）
- Instagram Graph API（ユーザー/メディア取得）

## 4. 機能一覧

### 4.1 Web UI

- ログイン/ログアウト
- フィルタ入力
- フィード取得
- EPUB生成

### 4.2 API

- `/api/auth/*` 認証フロー
- `/api/instagram/media` メディア取得
- `/api/epub` EPUB生成

### 4.3 出力仕様

- EPUBにタイトル/著者/連絡先/Instagram URLを埋め込み
- 生成後にブラウザでダウンロード

## 5. 設計

### 5.1 全体構成

- Next.js App Router単体運用
- Better Auth + Instagram Login
- APIはNextのRoute Handlerで提供

### 5.2 データフロー

- ログイン → OAuthコールバック → 長期トークン取得
- `/me` でユーザーID取得 → `/<IG_ID>/media` で投稿取得
- 取得データをフィルタ → EPUB生成

### 5.3 モジュール構成

- 認証: `webapp/server/src/lib/auth.ts`
- セッション解決: `webapp/server/src/lib/auth/session-service.ts`
- Graph API: `webapp/server/src/lib/instagram/graph-client.ts`
- UI: `webapp/server/app/page.tsx`

## 6. 設計の経緯

- Vite SPA構成は同一オリジン要件と相性が悪く、Next単体構成へ移行。
- Instagram Basic Display API終了により、Instagram Loginに切替。
- ローカルHTTPSをmkcertで用意し、MetaのHTTPS必須要件に対応。

## 7. つまずいた点と対策

### 7.1 OAuthリダイレクトURI

- 実際のコールバックは `/api/auth/oauth2/callback/instagram` だったため、Metaの設定と不一致。
- 対策: MetaのリダイレクトURIに実際のURLを登録。

### 7.2 HTTPS

- Meta側でHTTPS必須。
- 対策: mkcertでローカル証明書を発行し、HTTPS devスクリプトを追加。

### 7.3 Better Authユーザー情報

- Instagram Loginはemailを返さないため `email_is_missing`。
- 対策: `getUserInfo` で `id`/`name` を返し、疑似メールを生成。

### 7.4 callbackURLのフラグメント

- `/#filters` はOAuthで無効。
- 対策: `/?scroll=filters` などクエリで遷移。

## 8. 運用・テスト

### 8.1 起動

- HTTP: `pnpm dev`
- HTTPS: `pnpm dev:https`

### 8.2 環境変数

- `BETTER_AUTH_URL` はHTTPSを指定
- `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET`

### 8.3 テスト

- ユニット: `pnpm --dir webapp/server test`
- E2E: `pnpm --dir webapp test:e2e`

### 8.4 トラブルシュート

- OAuthエラーはリダイレクトURI/アプリIDの一致を最優先で確認
- `user_info_is_missing` は `getUserInfo` の実装を確認
- `email_is_missing` は疑似メール付与で回避

## 9. 本番インフラ構成決定の経緯

### 9.1 採用構成

- **基盤**: **Google Cloud Run**（単体コンテナ構成、東京リージョン `asia-northeast1`）
- **ドメイン**: 独自ドメイン `ksanchu.info`（Cloudflare にて取得・DNS管理済み。Cloudflare 経由で Cloud Run に接続し、SSL/TLS、DDoS防御、静的アセットのCDNキャッシュを併用）
- **シークレット管理**: **Google Cloud Secret Manager**（機密環境変数を安全にマウント）
- **CI/CD**: GitHub Actions（Workload Identity Federation によるキーレス連携で、`main` マージ時に即時自動デプロイ）

### 9.2 検討した選択肢と却下理由

1. **Vercel（Hobby無料枠）**:
   - **却下理由**: 実行時間上限（10秒）およびレスポンスボディ上限（4.5MB）が厳格すぎるため。複数投稿の画像取得・EPUB生成（数十MB以上）で確実にタイムアウトおよび転送エラーが発生する。また無料枠は商用利用禁止のため将来の有料化規約に抵触する。
2. **Compute Engine（GCE）での自前 Docker 運用**:
   - **却下理由**: 無料枠・低スペックマシン（`e2-micro`: メモリ1GB）では OOM（メモリ枯渇）によるプロセス突然死リスクが高い。また障害検知・自動復旧・OS保守・IPv4アドレス課金・バックアップスクリプト作成など、運用保守負荷が高すぎるため却下。
3. **静的配信 ＋ Cloud Run ＋ Cloud SQL / RDS**:
   - **却下理由**: フルマネージド RDB はアクセスゼロでも月額約1,500円〜1万円以上の固定費が発生する。初期の小規模・低コスト運用（月500円以下目標）に反するため過剰投資と判断。
4. **Cloud Run ＋ Pub/Sub / Cloud Tasks（非同期 Worker 構成）**:
   - **評価**: 500フィード（1500枚以上の高画質画像）を安定処理するための「将来の理想形」だが、初期公開にはコンポーネント数・UI実装が過剰（YAGNI の原則）。

### 9.3 Cloud Run 採用の決め手

- **完全従量課金 / 無料枠**: 最小インスタンス 0（ゼロスケール）により、アクセスがない間の稼働コストは完全 0 円。
- **長時間の処理耐性**: タイムアウトを最大60分まで設定可能、レスポンスサイズも32MB（ストリーミングなら無制限）と、EPUB生成処理に最適。
- **GCP 内完結 & 堅牢な CI/CD**: Secret Manager による機密情報保護、Workload Identity による安全な自動デプロイが容易。
- **Cloudflare との親和性**: DNS 設定およびプロキシ（CDN）との組み合わせが容易で、静的キャッシュにより Cloud Run の負荷をさらに抑制可能。

### 9.4 将来インフラを変更・拡張する際の考慮事項

- **500フィード（大量画像）対応時**: 同期 HTTP リクエストではブラウザ切断や Instagram API レート制限のリスクがあるため、**「Cloud Tasks ＋ Cloud Run Job ＋ Cloud Storage (GCS) による非同期ジョブ化」** へ移行すること。

---

## 10. DB・セッション管理構成決定の経緯

### 10.1 採用構成

- **構成**: **Better Auth ステートレス（DBレス・暗号化 Cookie）構成**
- **保存方式**: サーバー側に一切 DB を持たず、Instagram の長期アクセストークンおよびユーザーセッションを、サーバー秘密鍵（`BETTER_AUTH_SECRET`）で AES 暗号化した HttpOnly Cookie（`storeAccountCookie: true`）としてブラウザ側のみに保持。

### 10.2 検討した選択肢と却下理由

1. **ローカル SQLite (`better-sqlite3`)**:
   - **却下理由**: Cloud Run のゼロスケールおよび複数インスタンス起動時に、ローカルファイル（`better-auth.db`）が消失・不整合を起こすため本番運用不可。
2. **Cloud Run ＋ Cloud Storage (GCS FUSE マウント) ＋ SQLite**:
   - **却下理由**: ネットワークファイルマウント越しの SQLite は排他ロックを保証できず、複数リクエストで即座に DB 破損（malformed）を起こす致命的なアンチパターンのため絶対禁止。
3. **外部サーバーレス DB（Neon / Turso 等）**:
   - **却下理由**: 無料枠はあるものの、パブリックインターネットに DB エンドポイントが露出する。GCP 内完結・閉域性・シークレット流出リスクの観点から見送り。

### 10.3 ステートレス構成採用の決め手

- **プロダクト思想との完全一致**: 「作成した本のデータもサーバーに置かない」「フィードデータも残さない」という方針同様、サーバー側に個人情報やトークンを一切保存しないため、**「サーバーからのデータ漏洩」リスクが物理的にゼロ**。
- **コスト・運用リスクゼロ**: DB 費用 0 円。DB サーバーのクラッシュ、容量監視、バックアップ、スケールアウト競合の考慮がすべて不要。
- **Meta 審査との親和性**: サーバー上にデータを永続保持しないため、データ削除要件やプライバシーポリシーの整合性が極めて明快。

### 10.4 制約事項と将来 DB を導入する際の基準

- **現在の制約（トレードオフ）**:
  - サーバー側からの「セッション即時失効（強制ログアウト）」ができない（※ただし、将来認可レイヤを挟むことで利用停止は可能）。
  - Cookie の 4KB 制限があるため、余計なデータを詰め込めない。
- **将来 DB を導入するタイミング**:
  - 「ユーザーごとの設定（装丁プリセット等）」や「課金ステータス（有料会員フラグ）」を保存する必要が出た段階で、**Google Cloud Firestore**（毎日5万回アクセス無料、GCP内部通信、IAMキーレス認証）を追加する「ハイブリッド構成」へ移行する。
  - **移行時の注意**: DB クエリは API ハンドラーに直書きせず、`src/lib/db/` などの独立層にカプセル化して実装すること（将来 NoSQL から RDB への乗り換えを容易にするため）。
