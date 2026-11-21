---
description: "アトミックデザイン（3〜4層）に基づくUIコンポーネント作成・改修規約およびAgent-SOP遵守ルール"
applyTo: ["webapp/src/components/**/*.tsx", "webapp/src/components/**/*.ts"]
---

# UIコンポーネント実装・設計規約（AIエージェント向け指示）

`webapp/src/components/` 配下のフロントエンド UI コンポーネントを作成または変更する際は、以下のルールを**必ず（MUST）**遵守してください。

## 1. Agent-SOP スキルの必須参照

UI コンポーネントの実装・修正・リファクタリングに着手する前に、必ず [`.agent/skills/atomic-design-components/SKILL.md`](../../.agent/skills/atomic-design-components/SKILL.md) を読み、定義された手順と配置判断フローに従うこと。

## 2. アトミックデザイン 3〜4 層の責務分離

Next.js App Router（`webapp/app/` = Pages）を前提とし、`src/components/` 配下を以下の 3 層に明確に分離します。

1. **Atoms (`webapp/src/components/atoms/`)**:
   - 最小単位の UI 要素（`FilterChip`, `InlineLoadingStatus` 等）。
   - ドメイン知識・ビジネスモデル（`FeedPostItem` 等）に依存してはならない。プリミティブ型のみを受け取る。
   - インタラクティブ要素は 44px（`min-h-[44px]`）以上のタップ領域を確保する。
2. **Molecules (`webapp/src/components/molecules/`)**:
   - 複数の Atom や基本要素を組み合わせた単一責務パーツ（`HashtagQuickSelect`, `AlertBanner` 等）。
   - 画面全体の状態管理を抱え込まず、イベント（`onSelectTag` 等）で疎結合に保つ。
3. **Organisms (`webapp/src/components/organisms/`)**:
   - 画面の独立したセクション、フォーム、ステップカード、ナビゲーション、モーダル（`FeedFilterStep`, `PostListStep`, `Navbar` 等）。
4. **Pages (`webapp/app/`)**:
   - ルーティング、ページ全体の状態管理・データ取得・Organisms の配置。

## 3. バレルファイルと単体テストの義務化

- 新しいコンポーネントを追加した場合は、必ず各層の `index.ts` からエクスポートする。
- 全コンポーネント（Atoms / Molecules / Organisms）の作成・更新時は、同ディレクトリに 1:1 コロケーションで `[ComponentName].test.tsx` を作成し、`it.each` を用いた網羅的な単体テスト（日本語表記）を作成する。
- 変更完了前に `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm --filter instagram-feed-epublisher-webapp exec tsc --noEmit` を実行してエラー 0 件を確認する。
