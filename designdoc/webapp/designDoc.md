# Webapp設計ドキュメント

## 1. 目的・背景
- Instagramの投稿を取得し、EPUBとしてまとめてダウンロードできるWeb UIを提供する。
- 認証はInstagram Login（Instagram API with Instagram Login）を使用し、同一オリジンでAPIとUIを運用する。

## 2. 要件

### 2.1 機能要件
- Instagramログイン（OAuth）
- 自分の投稿（メディア）の取得
- フィルタ（ハッシュタグ/期間/件数）
- EPUB生成とダウンロード
- ログアウト

### 2.2 非機能要件
- 同一オリジンでUI/APIを提供すること
- HTTPS必須（Meta側の要件に対応）
- ローカル開発でもHTTPSで検証可能
- 最小限の依存で運用を簡潔化

### 2.3 外部サービス要件
- Instagram Login（Instagram API with Instagram Login）
- Instagram Graph API（ユーザー/メディア取得）

## 3. 機能一覧

### 3.1 Web UI
- ログイン/ログアウト
- フィルタ入力
- フィード取得
- EPUB生成

### 3.2 API
- `/api/auth/*` 認証フロー
- `/api/instagram/media` メディア取得
- `/api/epub` EPUB生成

### 3.3 出力仕様
- EPUBにタイトル/著者/連絡先/Instagram URLを埋め込み
- 生成後にブラウザでダウンロード

## 4. 設計

### 4.1 全体構成
- Next.js App Router単体運用
- Better Auth + Instagram Login
- APIはNextのRoute Handlerで提供

### 4.2 データフロー
- ログイン → OAuthコールバック → 長期トークン取得
- `/me` でユーザーID取得 → `/<IG_ID>/media` で投稿取得
- 取得データをフィルタ → EPUB生成

### 4.3 モジュール構成
- 認証: `webapp/server/src/lib/auth.ts`
- セッション解決: `webapp/server/src/lib/auth/session-service.ts`
- Graph API: `webapp/server/src/lib/instagram/graph-client.ts`
- UI: `webapp/server/app/page.tsx`

## 5. 設計の経緯
- Vite SPA構成は同一オリジン要件と相性が悪く、Next単体構成へ移行。
- Instagram Basic Display API終了により、Instagram Loginに切替。
- ローカルHTTPSをmkcertで用意し、MetaのHTTPS必須要件に対応。

## 6. つまずいた点と対策

### 6.1 OAuthリダイレクトURI
- 実際のコールバックは `/api/auth/oauth2/callback/instagram` だったため、Metaの設定と不一致。
- 対策: MetaのリダイレクトURIに実際のURLを登録。

### 6.2 HTTPS
- Meta側でHTTPS必須。
- 対策: mkcertでローカル証明書を発行し、HTTPS devスクリプトを追加。

### 6.3 Better Authユーザー情報
- Instagram Loginはemailを返さないため `email_is_missing`。
- 対策: `getUserInfo` で `id`/`name` を返し、疑似メールを生成。

### 6.4 callbackURLのフラグメント
- `/#filters` はOAuthで無効。
- 対策: `/?scroll=filters` などクエリで遷移。

## 7. 運用・テスト

### 7.1 起動
- HTTP: `pnpm dev`
- HTTPS: `pnpm dev:https`

### 7.2 環境変数
- `BETTER_AUTH_URL` はHTTPSを指定
- `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET`

### 7.3 テスト
- ユニット: `pnpm --dir webapp/server test`
- E2E: `pnpm --dir webapp test:e2e`

### 7.4 トラブルシュート
- OAuthエラーはリダイレクトURI/アプリIDの一致を最優先で確認
- `user_info_is_missing` は `getUserInfo` の実装を確認
- `email_is_missing` は疑似メール付与で回避
