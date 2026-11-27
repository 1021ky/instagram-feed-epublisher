/**
 * @file Feature-First × Atomic Design のレイヤー依存方向・Public API・純粋モデル分離・@file ヘッダ規約を強制するカスタム Oxlint JS プラグイン。
 */
import path from "node:path";

const TEST_OR_DECLARATION_FILE_PATTERN =
  /\.(?:test|browser\.test|spec)\.[cm]?[jt]sx?$|\.d\.[cm]?ts$/;
const INDEX_FILE_PATTERN = /(?:^|\/)index\.tsx?$/;
const FEATURE_SLICE_PATTERN = /\/src\/features\/([^/]+)\//;
const DEEP_FEATURE_ALIAS_PATTERN = /^@\/features\/[^/]+\/.+/;
const FEATURE_ALIAS_SLICE_PATTERN = /^@\/features\/([^/]+)(?:\/|$)/;
const PURE_MODEL_FILE_PATTERN = /\/src\/features\/[^/]+\/model\/([^/]+)\.ts$/;
const ATOM_FILE_PATTERN = /\/src\/components\/atoms\/[^/]+\.tsx?$/;
const LEADING_JSDOC_PATTERN = /^\/\*\*([\s\S]*?)\*\//;
const FILE_TAG_PATTERN = /@file[ \t]+\S/;

/**
 * ファイルパス区切り文字を POSIX 形式（`/`）へ正規化する。
 */
function normalizePath(filename) {
  return String(filename ?? "").replaceAll("\\", "/");
}

/**
 * テストファイルまたは型宣言ファイルかどうかを判定する。
 */
function isTestOrDeclarationFile(filename) {
  return TEST_OR_DECLARATION_FILE_PATTERN.test(filename);
}

/**
 * React / React DOM へのパッケージ import かどうかを判定する。
 */
function isReactPackage(source) {
  return (
    source === "react" ||
    source.startsWith("react/") ||
    source === "react-dom" ||
    source.startsWith("react-dom/")
  );
}

/**
 * ImportDeclaration が型専用（ランタイム依存なし）かどうかを判定する。
 */
function isTypeOnlyImport(node) {
  if (node.importKind === "type") {
    return true;
  }
  return (
    Array.isArray(node.specifiers) &&
    node.specifiers.length > 0 &&
    node.specifiers.every(
      (specifier) => specifier.type === "ImportSpecifier" && specifier.importKind === "type",
    )
  );
}

/**
 * 相対 import パスを正規化済みの絶対風 POSIX パスへ解決する。
 */
function resolveRelativeImport(normalizedFilename, source) {
  if (!source.startsWith(".")) {
    return null;
  }
  const baseDir = path.posix.dirname(normalizedFilename);
  return path.posix.resolve(baseDir, source);
}

/**
 * import/export のモジュール指定子が指定したいずれかのレイヤープレフィックスに該当するか判定する。
 */
function matchesForbiddenLayer(normalizedFilename, source, forbiddenTargets) {
  const resolvedRelative = resolveRelativeImport(normalizedFilename, source);

  for (const target of forbiddenTargets) {
    const aliasPrefix = `@/${target}`;
    if (source === aliasPrefix || source.startsWith(`${aliasPrefix}/`)) {
      return target;
    }

    if (resolvedRelative) {
      const srcSegment = target === "app" ? "/app" : `/src/${target}`;
      if (resolvedRelative.endsWith(srcSegment) || resolvedRelative.includes(`${srcSegment}/`)) {
        return target;
      }
    }
  }

  return null;
}

/**
 * ImportDeclaration / ExportNamedDeclaration / ExportAllDeclaration のすべてに対して
 * モジュール指定子チェック関数を登録するヘルパー。
 */
function createModuleSourceVisitor(check) {
  function handleNode(node) {
    if (node.source && typeof node.source.value === "string") {
      check(node, node.source.value);
    }
  }

  return {
    ImportDeclaration: handleNode,
    ExportNamedDeclaration: handleNode,
    ExportAllDeclaration: handleNode,
  };
}

export const rules = {
  "no-reverse-layer-import": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Enforce unidirectional layer dependencies and domain-agnostic boundaries for lib, atoms, molecules, and organisms.",
      },
    },
    create(context) {
      const filename = normalizePath(context.filename);
      if (isTestOrDeclarationFile(filename)) {
        return {};
      }

      let layerLabel = null;
      let forbiddenTargets = null;

      if (filename.includes("/src/lib/")) {
        layerLabel = "src/lib";
        forbiddenTargets = ["components", "features", "app"];
      } else if (filename.includes("/src/components/atoms/")) {
        layerLabel = "components/atoms";
        forbiddenTargets = [
          "components/molecules",
          "components/organisms",
          "features",
          "types",
          "lib",
          "app",
        ];
      } else if (filename.includes("/src/components/molecules/")) {
        layerLabel = "components/molecules";
        forbiddenTargets = ["components/organisms", "features", "types", "lib", "app"];
      } else if (filename.includes("/src/components/organisms/")) {
        layerLabel = "components/organisms";
        forbiddenTargets = ["features", "app"];
      }

      if (!forbiddenTargets) {
        return {};
      }

      return createModuleSourceVisitor((node, source) => {
        const hit = matchesForbiddenLayer(filename, source, forbiddenTargets);
        if (hit) {
          context.report({
            node: node.source,
            message: `Reverse or forbidden layer dependency: \`${layerLabel}\` must not import from \`${hit}\` ("${source}").`,
          });
        }
      });
    },
  },

  "enforce-feature-public-api": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow deep imports into feature slices (`@/features/<domain>/*`). Import from the slice Public API (`@/features/<domain>`) instead.",
      },
    },
    create(context) {
      return createModuleSourceVisitor((node, source) => {
        if (DEEP_FEATURE_ALIAS_PATTERN.test(source)) {
          const domainMatch = FEATURE_ALIAS_SLICE_PATTERN.exec(source);
          const domain = domainMatch ? domainMatch[1] : "<domain>";
          context.report({
            node: node.source,
            message: `Deep import "${source}" bypasses the feature Public API. Import from "@/features/${domain}" instead.`,
          });
        }
      });
    },
  },

  "no-cross-feature-import": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow cross-imports between sibling feature slices (`src/features/<A>` importing `src/features/<B>`).",
      },
    },
    create(context) {
      const filename = normalizePath(context.filename);
      const currentMatch = FEATURE_SLICE_PATTERN.exec(filename);
      if (!currentMatch) {
        return {};
      }
      const currentSlice = currentMatch[1];

      return createModuleSourceVisitor((node, source) => {
        let targetSlice = null;

        const aliasMatch = FEATURE_ALIAS_SLICE_PATTERN.exec(source);
        if (aliasMatch) {
          targetSlice = aliasMatch[1];
        } else {
          const resolved = resolveRelativeImport(filename, source);
          if (resolved) {
            const relMatch = FEATURE_SLICE_PATTERN.exec(`${resolved}/`);
            if (relMatch) {
              targetSlice = relMatch[1];
            }
          }
        }

        if (targetSlice && targetSlice !== currentSlice) {
          context.report({
            node: node.source,
            message: `Cross-feature import from \`features/${currentSlice}\` to \`features/${targetSlice}\` ("${source}") is forbidden. Orchestrate feature interactions in \`app/\` or extract shared logic to \`src/lib/\`.`,
          });
        }
      });
    },
  },

  "no-react-in-pure-model": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow importing React inside React-independent pure model modules (`src/features/*/model/*.ts` excluding `use*.ts` hooks and tests).",
      },
    },
    create(context) {
      const filename = normalizePath(context.filename);
      if (isTestOrDeclarationFile(filename)) {
        return {};
      }

      const match = PURE_MODEL_FILE_PATTERN.exec(filename);
      if (!match) {
        return {};
      }

      const basename = match[1];
      if (basename.startsWith("use")) {
        return {};
      }

      return {
        ImportDeclaration(node) {
          const source = node.source?.value;
          if (typeof source === "string" && isReactPackage(source)) {
            context.report({
              node,
              message: `Pure model module \`${basename}.ts\` must remain React-independent and cannot import "${source}". Move React state/effect bindings to a \`use*.ts\` adapter hook.`,
            });
          }
        },
      };
    },
  },

  "no-runtime-react-in-atoms": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow runtime React imports inside `src/components/atoms/` components. Only `import type` from React is permitted.",
      },
    },
    create(context) {
      const filename = normalizePath(context.filename);
      if (isTestOrDeclarationFile(filename) || !ATOM_FILE_PATTERN.test(filename)) {
        return {};
      }

      return {
        ImportDeclaration(node) {
          const source = node.source?.value;
          if (typeof source === "string" && isReactPackage(source) && !isTypeOnlyImport(node)) {
            context.report({
              node,
              message: `Runtime import from "${source}" is forbidden inside \`components/atoms/\`. Keep atoms stateless and use \`import type\` for React types only.`,
            });
          }
        },
      };
    },
  },

  "no-wildcard-reexport": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow wildcard re-exports (`export * from ...`) in barrel files (`index.ts`). Use explicit named exports to keep Public APIs intentional.",
      },
    },
    create(context) {
      const filename = normalizePath(context.filename);
      if (!INDEX_FILE_PATTERN.test(filename)) {
        return {};
      }

      return {
        ExportAllDeclaration(node) {
          context.report({
            node,
            message:
              "Wildcard re-export (`export *`) is forbidden in barrel `index.ts` files. Export only the intended Public API symbols explicitly.",
          });
        },
      };
    },
  },

  "require-file-header": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Require a leading JSDoc comment containing a non-empty `@file` description at the top of implementation files.",
      },
    },
    create(context) {
      const filename = normalizePath(context.filename);
      if (isTestOrDeclarationFile(filename)) {
        return {};
      }

      return {
        Program(node) {
          const rawText = context.sourceCode.getText().trimStart();
          const leadingJsDoc = LEADING_JSDOC_PATTERN.exec(rawText);
          if (!leadingJsDoc || !FILE_TAG_PATTERN.test(leadingJsDoc[1])) {
            context.report({
              node,
              loc: { line: 1, column: 0 },
              message:
                "Implementation files must start with a JSDoc header containing `@file <concise description of the file's role>`.",
            });
          }
        },
      };
    },
  },
};

export default {
  meta: {
    name: "architecture",
  },
  rules,
};
