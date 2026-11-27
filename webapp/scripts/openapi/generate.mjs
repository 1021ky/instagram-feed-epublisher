/**
 * @file Zod v4 スキーマから OpenAPI 3.1.0 JSON および Redocly 静的 HTML 仕様書を生成し、redocly lint で全 OpenAPI 仕様を検証する。
 *
 * Usage:
 *   node scripts/openapi/generate.mjs        # docs/openapi/bff-api.openapi.json と Redocly 静的 HTML (docs/openapi/index.html) を生成
 *   node scripts/openapi/generate.mjs --lint # BFF OpenAPI JSON と instagram-graph-api.openapi.yaml を redocly lint で検証
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { registerHooks } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { format as formatWithOxfmt } from "oxfmt";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webappDir = path.resolve(__dirname, "..", "..");
const repoRoot = path.resolve(webappDir, "..");
const srcDir = path.join(webappDir, "src");

export const DEFAULT_OUTPUT_DIR = path.join(repoRoot, "docs", "openapi");
export const OPENAPI_JSON_FILENAME = "bff-api.openapi.json";
export const OPENAPI_HTML_FILENAME = "index.html";
export const INSTAGRAM_OPENAPI_SPEC_PATH = path.join(
  DEFAULT_OUTPUT_DIR,
  "instagram-graph-api.openapi.yaml",
);
export const REDOCLY_CONFIG_PATH = path.join(repoRoot, "redocly.yaml");

let hooksRegistered = false;

/**
 * Node.js ESM で `@/*` パスエイリアスと `.ts` モジュールを直接解決・トランスパイルするためのフックを登録する。
 */
export function ensureTsLoaderHooks() {
  if (hooksRegistered) {
    return;
  }

  registerHooks({
    resolve(specifier, context, nextResolve) {
      let candidatePath = null;

      if (specifier.startsWith("@/")) {
        candidatePath = path.join(srcDir, specifier.slice(2));
      } else if (
        (specifier.startsWith("./") || specifier.startsWith("../")) &&
        context.parentURL?.startsWith("file:")
      ) {
        const parentDir = path.dirname(fileURLToPath(context.parentURL));
        const resolved = path.resolve(parentDir, specifier);
        if (!path.extname(resolved)) {
          candidatePath = resolved;
        }
      }

      if (candidatePath) {
        const tsFile = `${candidatePath}.ts`;
        if (fs.existsSync(tsFile)) {
          return {
            url: pathToFileURL(tsFile).href,
            shortCircuit: true,
          };
        }
        const indexTsFile = path.join(candidatePath, "index.ts");
        if (fs.existsSync(indexTsFile)) {
          return {
            url: pathToFileURL(indexTsFile).href,
            shortCircuit: true,
          };
        }
      }

      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url.startsWith("file:") && url.endsWith(".ts")) {
        const filePath = fileURLToPath(url);
        const source = fs.readFileSync(filePath, "utf8");
        const transpiled = ts.transpileModule(source, {
          fileName: filePath,
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            verbatimModuleSyntax: false,
          },
        });
        return {
          format: "module",
          source: transpiled.outputText,
          shortCircuit: true,
        };
      }

      return nextLoad(url, context);
    },
  });

  hooksRegistered = true;
}

/**
 * ローカルにインストールされた `@redocly/cli` バイナリのパスを解決する。
 */
function resolveRedoclyBinary() {
  const binName = process.platform === "win32" ? "redocly.cmd" : "redocly";
  return path.join(webappDir, "node_modules", ".bin", binName);
}

/**
 * Zod v4 スキーマから整形済みの OpenAPI 3.1.0 ドキュメントおよび JSON 文字列を構築する。
 */
export async function createBffOpenApiJson() {
  ensureTsLoaderHooks();

  const bffDocumentModule = await import(
    pathToFileURL(path.join(__dirname, "bff-document.ts")).href
  );

  const document = bffDocumentModule.buildBffOpenApiDocument();
  const rawJsonContent = `${JSON.stringify(document, null, 2)}\n`;
  const formattedJson = await formatWithOxfmt(OPENAPI_JSON_FILENAME, rawJsonContent);

  return {
    document,
    jsonContent: formattedJson.code,
  };
}

/**
 * 指定ディレクトリへ BFF OpenAPI JSON を書き出す。
 */
export async function generateBffOpenApiJsonFile({ outputDir = DEFAULT_OUTPUT_DIR } = {}) {
  const { document, jsonContent } = await createBffOpenApiJson();
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, OPENAPI_JSON_FILENAME);
  fs.writeFileSync(jsonPath, jsonContent, "utf8");

  return { document, jsonPath };
}

/**
 * 指定ディレクトリへ BFF OpenAPI JSON および Redocly 単一完結 HTML 仕様書を生成する。
 */
export async function generateBffOpenApiFiles({ outputDir = DEFAULT_OUTPUT_DIR } = {}) {
  const { jsonPath } = await generateBffOpenApiJsonFile({ outputDir });
  const htmlPath = path.join(outputDir, OPENAPI_HTML_FILENAME);

  const redoclyBin = resolveRedoclyBinary();
  const buildArgs = ["build-docs", jsonPath, "--output", htmlPath];
  if (fs.existsSync(REDOCLY_CONFIG_PATH)) {
    buildArgs.push("--config", REDOCLY_CONFIG_PATH);
  }
  execFileSync(redoclyBin, buildArgs, {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, REDOCLY_TELEMETRY: "off" },
  });

  return { jsonPath, htmlPath };
}

/**
 * 一時ディレクトリへ最新 BFF OpenAPI JSON を生成し、全 OpenAPI 仕様を `redocly lint` で検証する。
 */
export async function lintOpenApiSpecs() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bff-openapi-lint-"));
  try {
    const { jsonPath } = await generateBffOpenApiJsonFile({ outputDir: tempDir });
    const redoclyBin = resolveRedoclyBinary();
    const lintArgs = ["lint", jsonPath, INSTAGRAM_OPENAPI_SPEC_PATH];
    if (fs.existsSync(REDOCLY_CONFIG_PATH)) {
      lintArgs.push("--config", REDOCLY_CONFIG_PATH);
    }

    execFileSync(redoclyBin, lintArgs, {
      cwd: repoRoot,
      stdio: "inherit",
      env: { ...process.env, REDOCLY_TELEMETRY: "off" },
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function isMainModule() {
  return process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  if (process.argv.includes("--lint")) {
    await lintOpenApiSpecs();
  } else {
    const { jsonPath, htmlPath } = await generateBffOpenApiFiles();
    console.log(`Generated: ${path.relative(repoRoot, jsonPath)}`);
    console.log(`Generated: ${path.relative(repoRoot, htmlPath)}`);
  }
}
