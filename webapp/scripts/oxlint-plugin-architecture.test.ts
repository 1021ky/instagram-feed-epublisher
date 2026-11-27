import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { rules } from "./oxlint-plugin-architecture.mjs";

RuleTester.describe = ((text: string, fn: () => void) => {
  const label =
    text === "valid"
      ? "正常系（許可されるコード）"
      : text === "invalid"
        ? "異常系（違反として検出されるコード）"
        : text;
  return describe(label, fn);
}) as typeof RuleTester.describe;
RuleTester.it = it;

/** TypeScript / TSX 構文でアーキテクチャルールを検証するための Oxlint RuleTester インスタンス */
const ruleTester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: {
      lang: "tsx",
    },
  },
});

describe("アーキテクチャ制約 Oxlint プラグイン (oxlint-plugin-architecture)", () => {
  ruleTester.run(
    "レイヤー逆依存・ドメイン依存禁止ルール (no-reverse-layer-import)",
    rules["no-reverse-layer-import"],
    {
      valid: [
        {
          name: "atoms から lucide-react と React 型のみを import することを許可する",
          filename: "/repo/webapp/src/components/atoms/IconButton.tsx",
          code: 'import type * as React from "react"; import { X } from "lucide-react";',
        },
        {
          name: "molecules から atoms を import することを許可する",
          filename: "/repo/webapp/src/components/molecules/ModalDialog.tsx",
          code: 'import { IconButton } from "@/components/atoms";',
        },
        {
          name: "organisms から atoms・types・lib を import することを許可する",
          filename: "/repo/webapp/src/components/organisms/Navbar.tsx",
          code: 'import { InstagramBrandIcon } from "@/components/atoms"; import type { UserProfile } from "@/types/ui";',
        },
        {
          name: "lib 内から types を import することを許可する",
          filename: "/repo/webapp/src/lib/epub/sort.ts",
          code: 'import type { EpubSortOrder } from "@/types/ui";',
        },
        {
          name: "テストファイルはレイヤー逆依存チェックの対象外とする",
          filename: "/repo/webapp/src/components/atoms/IconButton.test.tsx",
          code: 'import { ModalDialog } from "@/components/molecules";',
        },
      ],
      invalid: [
        {
          name: "atoms から molecules を import することを禁止する",
          filename: "/repo/webapp/src/components/atoms/ActionButton.tsx",
          code: 'import { ModalDialog } from "@/components/molecules";',
          errors: [{ message: /`components\/atoms` must not import from `components\/molecules`/ }],
        },
        {
          name: "atoms からドメイン型 (@/types/ui) を import することを禁止する",
          filename: "/repo/webapp/src/components/atoms/ActionButton.tsx",
          code: 'import type { FeedPostItem } from "@/types/ui";',
          errors: [{ message: /`components\/atoms` must not import from `types`/ }],
        },
        {
          name: "molecules から organisms を import することを禁止する",
          filename: "/repo/webapp/src/components/molecules/StatusBanner.tsx",
          code: 'import { Navbar } from "@/components/organisms";',
          errors: [
            { message: /`components\/molecules` must not import from `components\/organisms`/ },
          ],
        },
        {
          name: "molecules から features を import することを禁止する",
          filename: "/repo/webapp/src/components/molecules/StatusBanner.tsx",
          code: 'import { LoginCard } from "@/features/auth";',
          errors: [{ message: /`components\/molecules` must not import from `features`/ }],
        },
        {
          name: "organisms から features を import することを禁止する",
          filename: "/repo/webapp/src/components/organisms/Navbar.tsx",
          code: 'import { LoginCard } from "@/features/auth";',
          errors: [{ message: /`components\/organisms` must not import from `features`/ }],
        },
        {
          name: "src/lib から components を import することを禁止する",
          filename: "/repo/webapp/src/lib/epub/sort.ts",
          code: 'import { ActionButton } from "@/components/atoms";',
          errors: [{ message: /`src\/lib` must not import from `components`/ }],
        },
        {
          name: "相対パス経由での逆方向依存も禁止する",
          filename: "/repo/webapp/src/components/molecules/StatusBanner.tsx",
          code: 'import { LoginCard } from "../../features/auth";',
          errors: [{ message: /`components\/molecules` must not import from `features`/ }],
        },
      ],
    },
  );

  ruleTester.run(
    "Feature Public API 強制ルール (enforce-feature-public-api)",
    rules["enforce-feature-public-api"],
    {
      valid: [
        {
          name: "Feature ルートバレル (@/features/<domain>) からの import を許可する",
          filename: "/repo/webapp/app/page.tsx",
          code: 'import { LoginCard, useAuthFlow } from "@/features/auth";',
        },
        {
          name: "同一スライス内の相対パス import を許可する",
          filename: "/repo/webapp/src/features/auth/ui/LogoutNoticeBanner.tsx",
          code: 'import { formatLogoutBannerTitle } from "../model/profile";',
        },
      ],
      invalid: [
        {
          name: "app から Feature 内部 ui ファイルへの深部 import を禁止する",
          filename: "/repo/webapp/app/page.tsx",
          code: 'import { LoginCard } from "@/features/auth/ui/LoginCard";',
          errors: [{ message: /Import from "@\/features\/auth" instead/ }],
        },
        {
          name: "Feature 内部 model ファイルへの深部 re-export も禁止する",
          filename: "/repo/webapp/app/page.tsx",
          code: 'export { selection } from "@/features/feed/model/selection";',
          errors: [{ message: /Import from "@\/features\/feed" instead/ }],
        },
      ],
    },
  );

  ruleTester.run(
    "Feature 間 Cross-import 禁止ルール (no-cross-feature-import)",
    rules["no-cross-feature-import"],
    {
      valid: [
        {
          name: "同一 Feature 内の相対 import を許可する",
          filename: "/repo/webapp/src/features/feed/ui/PostCard.tsx",
          code: 'import { toPostCardViewModel } from "../model/post-presenter";',
        },
        {
          name: "Feature から共通 components・lib を import することを許可する",
          filename: "/repo/webapp/src/features/epub-export/ui/ExportModal.tsx",
          code: 'import { ModalDialog } from "@/components/molecules"; import { requestEpub } from "@/lib/client/instagram";',
        },
        {
          name: "app 層から複数の Feature を import することを許可する",
          filename: "/repo/webapp/app/page.tsx",
          code: 'import { useAuthFlow } from "@/features/auth"; import { useFeedFilter } from "@/features/feed-filter";',
        },
      ],
      invalid: [
        {
          name: "エイリアス経由での別 Feature import を禁止する",
          filename: "/repo/webapp/src/features/epub-export/model/useEpubExport.ts",
          code: 'import { useFeedFilter } from "@/features/feed-filter";',
          errors: [
            {
              message:
                /Cross-feature import from `features\/epub-export` to `features\/feed-filter`/,
            },
          ],
        },
        {
          name: "相対パス経由での別 Feature import を禁止する",
          filename: "/repo/webapp/src/features/epub-export/ui/ExportModal.tsx",
          code: 'import { LoginCard } from "../../auth/ui/LoginCard";',
          errors: [
            { message: /Cross-feature import from `features\/epub-export` to `features\/auth`/ },
          ],
        },
      ],
    },
  );

  ruleTester.run(
    "純粋モデル層の React 依存禁止ルール (no-react-in-pure-model)",
    rules["no-react-in-pure-model"],
    {
      valid: [
        {
          name: "純粋 model ファイルが型と純粋ユーティリティのみを import することを許可する",
          filename: "/repo/webapp/src/features/feed/model/selection.ts",
          code: 'import type { FeedPostItem } from "@/types/ui";',
        },
        {
          name: "use*.ts カスタムフックでの React import を許可する",
          filename: "/repo/webapp/src/features/feed/model/useFeedSelection.ts",
          code: 'import { useCallback, useMemo, useState } from "react";',
        },
        {
          name: "テストファイルは純粋モデル React 禁止の対象外とする",
          filename: "/repo/webapp/src/features/feed/model/selection.test.ts",
          code: 'import * as React from "react";',
        },
      ],
      invalid: [
        {
          name: "純粋 model ファイルでの react ランタイム import を禁止する",
          filename: "/repo/webapp/src/features/epub-export/model/export-payload.ts",
          code: 'import { useState } from "react";',
          errors: [
            { message: /Pure model module `export-payload\.ts` must remain React-independent/ },
          ],
        },
        {
          name: "純粋 model ファイルでの react 型 import も禁止する",
          filename: "/repo/webapp/src/features/feed/model/post-presenter.ts",
          code: 'import type * as React from "react";',
          errors: [
            { message: /Pure model module `post-presenter\.ts` must remain React-independent/ },
          ],
        },
      ],
    },
  );

  ruleTester.run(
    "Atoms のランタイム React 依存禁止ルール (no-runtime-react-in-atoms)",
    rules["no-runtime-react-in-atoms"],
    {
      valid: [
        {
          name: "import type による React 型の参照を許可する",
          filename: "/repo/webapp/src/components/atoms/ActionButton.tsx",
          code: 'import type * as React from "react";',
        },
        {
          name: "インライン型指定子の import { type ReactNode } を許可する",
          filename: "/repo/webapp/src/components/atoms/IconButton.tsx",
          code: 'import { type MouseEvent, type ReactNode } from "react";',
        },
        {
          name: "テストファイルでの React import は許可する",
          filename: "/repo/webapp/src/components/atoms/ActionButton.test.tsx",
          code: 'import { renderToStaticMarkup } from "react-dom/server";',
        },
      ],
      invalid: [
        {
          name: "Atoms 内での React Hooks ランタイム import を禁止する",
          filename: "/repo/webapp/src/components/atoms/FilterChip.tsx",
          code: 'import { useState } from "react";',
          errors: [
            { message: /Runtime import from "react" is forbidden inside `components\/atoms\/`/ },
          ],
        },
        {
          name: "Atoms 内での import * as React ランタイム import を禁止する",
          filename: "/repo/webapp/src/components/atoms/IconButton.tsx",
          code: 'import * as React from "react";',
          errors: [
            { message: /Runtime import from "react" is forbidden inside `components\/atoms\/`/ },
          ],
        },
      ],
    },
  );

  ruleTester.run(
    "バレルファイルでのワイルドカード再エクスポート禁止ルール (no-wildcard-reexport)",
    rules["no-wildcard-reexport"],
    {
      valid: [
        {
          name: "バレルファイルでの明示的な名前付きエクスポートを許可する",
          filename: "/repo/webapp/src/features/auth/index.ts",
          code: 'export { LoginCard, type LoginCardProps } from "./ui/LoginCard";',
        },
        {
          name: "index.ts 以外のファイルは対象外とする",
          filename: "/repo/webapp/src/lib/client/instagram.ts",
          code: 'export * from "@/lib/instagram/types";',
        },
      ],
      invalid: [
        {
          name: "index.ts での export * from を禁止する",
          filename: "/repo/webapp/src/features/auth/index.ts",
          code: 'export * from "./model/profile";',
          errors: [{ message: /Wildcard re-export \(`export \*`\) is forbidden/ }],
        },
      ],
    },
  );

  ruleTester.run(
    "実装ファイル先頭の @file ヘッダ必須ルール (require-file-header)",
    rules["require-file-header"],
    {
      valid: [
        {
          name: "先頭 JSDoc に具体的な @file 説明文がある実装ファイルを許可する",
          filename: "/repo/webapp/src/features/feed/model/selection.ts",
          code: "/**\n * @file 投稿一覧の選択判定と状態更新を行う。\n */\nexport const count = 1;",
        },
        {
          name: "テストファイルは @file 必須チェックの対象外とする",
          filename: "/repo/webapp/src/features/feed/model/selection.test.ts",
          code: 'import { describe } from "vitest";',
        },
        {
          name: "型宣言ファイル (.d.ts) は @file 必須チェックの対象外とする",
          filename: "/repo/webapp/src/types/custom.d.ts",
          code: "export type Example = string;",
        },
      ],
      invalid: [
        {
          name: "先頭 JSDoc が無い実装ファイルを禁止する",
          filename: "/repo/webapp/src/features/feed/model/selection.ts",
          code: "export const count = 1;",
          errors: [{ message: /must start with a JSDoc header containing `@file/ }],
        },
        {
          name: "先頭 JSDoc に @file タグが含まれない実装ファイルを禁止する",
          filename: "/repo/webapp/src/components/atoms/FilterChip.tsx",
          code: "/**\n * フィルターチップ\n */\nexport function FilterChip() { return null; }",
          errors: [{ message: /must start with a JSDoc header containing `@file/ }],
        },
        {
          name: "@file タグの後に説明文が空の実装ファイルを禁止する",
          filename: "/repo/webapp/src/lib/format/date.ts",
          code: "/**\n * @file   \n */\nexport function formatDate() { return ''; }",
          errors: [{ message: /must start with a JSDoc header containing `@file/ }],
        },
      ],
    },
  );
});
