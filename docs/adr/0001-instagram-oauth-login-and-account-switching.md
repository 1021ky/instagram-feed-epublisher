# ADR-0001: Instagram OAuth ログイン時の再認証制御とアカウント切り替え導線の設計

- **ステータス**: Accepted
- **日付**: 2026-11-20
- **関連 Issue**: [#100](https://github.com/1021ky/instagram-feed-epublisher/issues/100)

## 1. 背景 (Context)

本アプリは Better Auth の JWE Cookie Cache を利用し、サーバー側にユーザーデータやトークンを保有しない完全ステートレス構成で運用しています。
初期実装では `webapp/src/lib/auth.ts` の `authorizationUrlParams` に `force_authentication: "1"` が設定されていたため、初回ログインでなくてもログインのたびに Instagram 側で再認証・確認画面が強制表示される状態となっていました。

Meta 公式ドキュメント（[Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)）を確認した結果、以下の仕様と制約が判明しました。

1. `https://www.instagram.com/oauth/authorize` において、再認証を強制する公式パラメータは `force_reauth`（Boolean、デフォルト `false`。旧来・内部パラメータ `force_authentication=1` 相当）である。
2. `force_reauth` を指定しない（デフォルト `false`）ことで、アプリ側が毎回強制再認証を要求する挙動は停止できる。
3. 一方で、Instagram OAuth には OpenID Connect (OIDC) の `prompt=none`（同意画面の完全スキップ）、`prompt=select_account`（アカウント選択画面の表示）、RP-Initiated Logout（アプリ側からの IdP ログアウト）に相当する公式パラメータ・API は存在しない。

また、アプリ側でログアウト（Local Sign-Out）した際に、ブラウザ上の Instagram ログインセッションは維持されるため、再ログイン時の振る舞いをどのように設計するかが論点となりました。

## 2. 検討した選択肢 (Options Considered)

| 案                                                              | 概要                                                                                                                                           | メリット                                                                             | デメリット                                                                                                                    |
| :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **案1: シームレス SSO 型**                                      | `force_authentication` / `force_reauth` を削除し、常に既存セッションでログインする                                                             | 実装が最小限で、通常再ログイン時の摩擦が最も少ない                                   | アプリからログアウトしても別アカウントに切り替えにくい（別タブで Instagram 側の切り替えが必要）。共有端末での誤ログインに弱い |
| **案2: 通常 SSO ＋「別のアカウントでログイン」2導線型（採用）** | 通常ログインは `force_reauth` なしとしつつ、UI に「別のアカウントでログイン」（`force_reauth=true`）導線を分離し、ログアウト時に補足を提示する | OAuth 2.0 ベストプラクティスに沿い、通常利用の快適さとアカウント切り替えの両立が可能 | 案1より実装箇所（Route Handler でのクエリ付与と UI 導線）が増える                                                             |
| **案3: 都度再認証型**                                           | 現状通り常に `force_reauth=true` 相当を維持する                                                                                                | ログアウト後の別アカウントログインや共有端末での安全性が高い                         | 通常ログインでも毎回 Instagram 側の認証・確認画面が表示され、Issue #100 の課題が解消しない                                    |

## 3. 決定 (Decision)

**案2（通常 SSO ＋「別のアカウントでログイン」2導線型）** を採用します。

### 採用理由

- **OAuth ベストプラクティスとの整合**: モダン Web / OAuth 2.0 ガイドラインでは、通常のシームレスな再ログインと、明示的な再認証・アカウント切り替え（OIDC における `prompt=login` 相当）を UI 導線として分離することが推奨されています。
- **利用ユースケースへの適合**: 本アプリは個人端末から自身の Instagram フィードを EPUB 化する用途が中心であるため、通常ログインは摩擦を最小化し、複数アカウントの使い分けが必要な場合のみ「別のアカウントでログイン」で `force_reauth=true` を明示できる構成が最もユーザー体験に適しています。
- **ステートレス構成の維持**: サーバー側にセッション DB 等を一切持たず、既存の Better Auth JWE Cookie Cache 構成のまま実現できます。

### 実装方針

1. `webapp/src/lib/auth.ts` の `authorizationUrlParams` から `force_authentication: "1"` を削除する。
2. Meta App Dashboard の Valid OAuth Redirect URIs（`/api/auth/oauth2/callback/instagram`）との不一致を防ぐため、`providerId: "instagram"` は 1 つのまま維持し、`POST /api/auth/sign-in/oauth2?force_reauth=true` が要求された場合のみ `webapp/app/api/auth/[...all]/route.ts` にて返却認可 URL へ `force_reauth=true` を付与する。
3. ログイン画面（`LoginCard`）に「別のアカウントでログイン」導線を配置し、本アプリからログアウトした直後には「ブラウザ上の Instagram ログイン状態は維持されている」旨の補足案内を表示する。

## 4. 影響・トレードオフ (Consequences)

- **共有端末での利用**: 通常の「Instagramでログイン」ではブラウザに残っている Instagram セッションが利用されるため、共有ブラウザで他人のセッションが残っている場合は意図しないアカウントでログインされる可能性があります（一般的な OAuth SSO と同等の水準）。本アプリは読み取りスコープ（`instagram_business_basic`）のみを扱い、サーバー側にデータを保存しないため影響は限定的ですが、別アカウントへ入りたい場合は「別のアカウントでログイン」導線を利用する運用とします。
- **Meta 側の同意画面仕様への依存**: `force_reauth` を外しても、2回目以降のログインで Instagram 側（`/consent/?flow=ig_biz_login_oauth`）が確認画面を自動スキップするかは Meta 側のサーバー判定に依存します。
