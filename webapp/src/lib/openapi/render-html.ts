/**
 * @file OpenAPI 3.1.0 JSON ドキュメントから自己完結型の静的 HTML 仕様書を生成するレンダラー。
 *
 * 外部 CDN に依存せず、`file://` 直開きおよび Private GitHub Pages 上のどちらでも安全に閲覧できる HTML を生成します。
 */

export interface OpenApiDocumentLike {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

interface SchemaPropertyRow {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
}

const HTTP_METHOD_ORDER = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

/**
 * HTML 文字列エスケープ。
 */
export function escapeHtml(value: unknown): string {
  const str = String(value ?? "");
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * `<script type="application/json">` 内への安全な JSON 埋め込み用に特殊文字をエスケープします。
 */
function serializeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveSchemaRef(
  schema: unknown,
  schemas: Record<string, unknown>,
  visited = new Set<string>(),
): Record<string, unknown> | null {
  if (!isRecord(schema)) {
    return null;
  }

  const ref = schema.$ref;
  if (typeof ref === "string" && ref.startsWith("#/components/schemas/")) {
    const schemaName = ref.slice("#/components/schemas/".length);
    if (visited.has(schemaName)) {
      return schema;
    }
    const target = schemas[schemaName];
    if (isRecord(target)) {
      const nextVisited = new Set(visited);
      nextVisited.add(schemaName);
      return resolveSchemaRef(target, schemas, nextVisited);
    }
  }

  return schema;
}

function formatSchemaType(schema: unknown): string {
  if (!isRecord(schema)) {
    return "unknown";
  }

  if (typeof schema.$ref === "string" && schema.$ref.startsWith("#/components/schemas/")) {
    const name = schema.$ref.slice("#/components/schemas/".length);
    return name;
  }

  if (Array.isArray(schema.enum)) {
    return `enum(${schema.enum.map((v) => JSON.stringify(v)).join(" | ")})`;
  }

  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.map((item) => formatSchemaType(item)).join(" | ");
  }

  if (Array.isArray(schema.oneOf)) {
    return schema.oneOf.map((item) => formatSchemaType(item)).join(" | ");
  }

  if (Array.isArray(schema.allOf)) {
    return schema.allOf.map((item) => formatSchemaType(item)).join(" & ");
  }

  const baseType = Array.isArray(schema.type)
    ? schema.type.join(" | ")
    : typeof schema.type === "string"
      ? schema.type
      : "object";

  if (baseType === "array") {
    const itemType = formatSchemaType(schema.items);
    return `${itemType}[]`;
  }

  if (typeof schema.format === "string") {
    return `${baseType}<${schema.format}>`;
  }

  return baseType;
}

function formatExample(schema: Record<string, unknown>): string {
  if (schema.example !== undefined) {
    return JSON.stringify(schema.example);
  }
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return JSON.stringify(schema.examples[0]);
  }
  if (schema.default !== undefined) {
    return `default: ${JSON.stringify(schema.default)}`;
  }
  return "-";
}

function extractProperties(
  schema: unknown,
  schemas: Record<string, unknown>,
  prefix = "",
  visited = new Set<string>(),
): SchemaPropertyRow[] {
  const resolved = resolveSchemaRef(schema, schemas, visited);
  if (!resolved) {
    return [];
  }

  const rows: SchemaPropertyRow[] = [];

  if (isRecord(resolved.properties)) {
    const requiredSet = new Set(
      Array.isArray(resolved.required)
        ? resolved.required.filter((item): item is string => typeof item === "string")
        : [],
    );

    for (const [propName, rawProp] of Object.entries(resolved.properties)) {
      const fullName = prefix ? `${prefix}.${propName}` : propName;
      const propObj =
        resolveSchemaRef(rawProp, schemas, visited) ?? (isRecord(rawProp) ? rawProp : {});
      rows.push({
        name: fullName,
        type: formatSchemaType(rawProp),
        required: requiredSet.has(propName),
        description: typeof propObj.description === "string" ? propObj.description : "-",
        example: formatExample(propObj),
      });

      if (isRecord(propObj.properties)) {
        rows.push(...extractProperties(propObj, schemas, fullName, visited));
      }
    }
  }

  return rows;
}

function renderPropertyTable(rows: SchemaPropertyRow[]): string {
  if (rows.length === 0) {
    return "";
  }

  const bodyRows = rows
    .map(
      (row) => `
        <tr>
          <td><code>${escapeHtml(row.name)}</code></td>
          <td><code>${escapeHtml(row.type)}</code></td>
          <td>${row.required ? '<span class="badge badge-req">必須</span>' : '<span class="badge badge-opt">任意</span>'}</td>
          <td>${escapeHtml(row.description)}</td>
          <td><code>${escapeHtml(row.example)}</code></td>
        </tr>`,
    )
    .join("");

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>フィールド</th>
            <th>型</th>
            <th>必須</th>
            <th>説明</th>
            <th>例</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

function renderContentSection(
  content: unknown,
  schemas: Record<string, unknown>,
  summaryLabel: string,
): string {
  if (!isRecord(content)) {
    return "";
  }

  return Object.entries(content)
    .map(([mediaType, mediaObj]) => {
      const schema = isRecord(mediaObj) ? mediaObj.schema : undefined;
      const rows = extractProperties(schema, schemas);
      const tableHtml = renderPropertyTable(rows);
      const schemaType = formatSchemaType(schema);
      const schemaJson = schema ? escapeHtml(JSON.stringify(schema, null, 2)) : "{}";

      return `
        <div class="media-block">
          <div class="media-header">
            <span class="badge badge-media">${escapeHtml(mediaType)}</span>
            <span class="schema-type">Schema: <code>${escapeHtml(schemaType)}</code></span>
          </div>
          ${tableHtml}
          <details class="raw-toggle">
            <summary>${escapeHtml(summaryLabel)} (${escapeHtml(mediaType)})</summary>
            <pre><code>${schemaJson}</code></pre>
          </details>
        </div>`;
    })
    .join("");
}

function getStatusBadgeClass(status: string): string {
  if (status.startsWith("2")) return "status-2xx";
  if (status.startsWith("4")) return "status-4xx";
  if (status.startsWith("5")) return "status-5xx";
  return "status-other";
}

function slugifyId(prefix: string, raw: string): string {
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "")}`;
}

/**
 * OpenAPI 3.1.0 ドキュメントオブジェクトから自己完結型の静的 HTML を生成します。
 */
export function renderOpenApiHtml(document: OpenApiDocumentLike): string {
  const title = document.info?.title ?? "API Reference";
  const version = document.info?.version ?? "1.0.0";
  const openapiVersion = document.openapi ?? "3.1.0";
  const description = document.info?.description ?? "";
  const paths = isRecord(document.paths) ? document.paths : {};
  const schemas = isRecord(document.components?.schemas) ? document.components.schemas : {};

  const endpointEntries: Array<{
    id: string;
    path: string;
    method: string;
    operation: Record<string, unknown>;
  }> = [];

  for (const [apiPath, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;
    for (const method of HTTP_METHOD_ORDER) {
      const operation = pathItem[method];
      if (isRecord(operation)) {
        endpointEntries.push({
          id: slugifyId("op", `${method}-${apiPath}`),
          path: apiPath,
          method: method.toUpperCase(),
          operation,
        });
      }
    }
  }

  const endpointNavLinks = endpointEntries
    .map(
      (entry) => `
        <li>
          <a href="#${escapeHtml(entry.id)}">
            <span class="method-pill method-${escapeHtml(entry.method.toLowerCase())}">${escapeHtml(entry.method)}</span>
            <span class="nav-path">${escapeHtml(entry.path)}</span>
          </a>
        </li>`,
    )
    .join("");

  const schemaNavLinks = Object.keys(schemas)
    .map((schemaName) => {
      const id = slugifyId("schema", schemaName);
      return `<li><a href="#${escapeHtml(id)}"><code>${escapeHtml(schemaName)}</code></a></li>`;
    })
    .join("");

  const endpointCards = endpointEntries
    .map((entry) => {
      const summary = typeof entry.operation.summary === "string" ? entry.operation.summary : "";
      const opDescription =
        typeof entry.operation.description === "string" ? entry.operation.description : "";

      const requestBody = isRecord(entry.operation.requestBody)
        ? entry.operation.requestBody
        : null;
      const requestBodyHtml = requestBody
        ? `
          <section class="subsection">
            <h4>Request Body ${requestBody.required === true ? '<span class="badge badge-req">Required</span>' : ""}</h4>
            ${renderContentSection(requestBody.content, schemas, "Request JSON Schema を表示")}
          </section>`
        : "";

      const responses = isRecord(entry.operation.responses) ? entry.operation.responses : {};
      const responsesHtml = Object.entries(responses)
        .map(([statusCode, respObj]) => {
          const respRecord = isRecord(respObj) ? respObj : {};
          const respDesc = typeof respRecord.description === "string" ? respRecord.description : "";
          const respContentHtml = renderContentSection(
            respRecord.content,
            schemas,
            `Response ${statusCode} JSON Schema を表示`,
          );

          return `
            <div class="response-item">
              <div class="response-header">
                <span class="status-badge ${getStatusBadgeClass(statusCode)}">${escapeHtml(statusCode)}</span>
                <span class="response-desc">${escapeHtml(respDesc)}</span>
              </div>
              ${respContentHtml}
            </div>`;
        })
        .join("");

      return `
        <article class="card endpoint-card" id="${escapeHtml(entry.id)}">
          <div class="endpoint-header">
            <span class="method-pill method-${escapeHtml(entry.method.toLowerCase())}">${escapeHtml(entry.method)}</span>
            <h3 class="endpoint-path"><code>${escapeHtml(entry.path)}</code></h3>
          </div>
          ${summary ? `<p class="endpoint-summary">${escapeHtml(summary)}</p>` : ""}
          ${opDescription ? `<p class="endpoint-desc">${escapeHtml(opDescription)}</p>` : ""}
          ${requestBodyHtml}
          <section class="subsection">
            <h4>Responses</h4>
            <div class="responses-list">${responsesHtml}</div>
          </section>
        </article>`;
    })
    .join("");

  const schemaCards = Object.entries(schemas)
    .map(([schemaName, schemaDef]) => {
      const id = slugifyId("schema", schemaName);
      const schemaRecord = isRecord(schemaDef) ? schemaDef : {};
      const schemaDesc =
        typeof schemaRecord.description === "string" ? schemaRecord.description : "";
      const rows = extractProperties(schemaRecord, schemas);
      const typeLabel = formatSchemaType(schemaRecord);

      return `
        <article class="card schema-card" id="${escapeHtml(id)}">
          <div class="schema-header">
            <h3><code>${escapeHtml(schemaName)}</code></h3>
            <span class="badge badge-media">${escapeHtml(typeLabel)}</span>
          </div>
          ${schemaDesc ? `<p class="schema-desc">${escapeHtml(schemaDesc)}</p>` : ""}
          ${renderPropertyTable(rows)}
          <details class="raw-toggle">
            <summary>JSON Schema 定義を表示</summary>
            <pre><code>${escapeHtml(JSON.stringify(schemaDef, null, 2))}</code></pre>
          </details>
        </article>`;
    })
    .join("");

  const embeddedJson = serializeJsonForScriptTag(document);

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} — OpenAPI ${escapeHtml(openapiVersion)}</title>
    <style>
      :root {
        --bg: #f8fafc;
        --surface: #ffffff;
        --surface-muted: #f1f5f9;
        --border: #e2e8f0;
        --text: #0f172a;
        --text-muted: #475569;
        --accent: #2563eb;
        --accent-soft: #dbeafe;
        --code-bg: #0f172a;
        --code-text: #e2e8f0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.6;
      }

      a {
        color: var(--accent);
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      code,
      pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        min-height: 100vh;
      }

      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
        padding: 24px 18px;
        background: var(--surface);
        border-right: 1px solid var(--border);
      }

      .sidebar-title {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin: 20px 0 8px;
      }

      .sidebar-title:first-child {
        margin-top: 0;
      }

      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .nav-list a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
        color: var(--text);
        font-size: 0.875rem;
      }

      .nav-list a:hover {
        background: var(--surface-muted);
        text-decoration: none;
      }

      .nav-path {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.8125rem;
      }

      .main {
        padding: 32px 40px 64px;
        max-width: 1040px;
      }

      .hero {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px 28px;
        margin-bottom: 28px;
      }

      .hero-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }

      .hero h1 {
        margin: 0 0 8px;
        font-size: 1.75rem;
        line-height: 1.3;
      }

      .hero p {
        margin: 0 0 16px;
        color: var(--text-muted);
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }

      .btn:hover {
        background: var(--surface-muted);
      }

      .btn-primary {
        background: var(--accent);
        border-color: var(--accent);
        color: #ffffff;
      }

      .btn-primary:hover {
        opacity: 0.92;
        background: var(--accent);
      }

      .copy-feedback {
        font-size: 0.8125rem;
        color: #15803d;
        font-weight: 600;
      }

      .section-heading {
        font-size: 1.25rem;
        margin: 32px 0 14px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border);
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 22px 24px;
        margin-bottom: 20px;
      }

      .endpoint-header,
      .schema-header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 8px;
      }

      .endpoint-path,
      .schema-header h3 {
        margin: 0;
        font-size: 1.125rem;
      }

      .endpoint-summary {
        margin: 4px 0 12px;
        font-weight: 600;
      }

      .endpoint-desc,
      .schema-desc {
        margin: 0 0 14px;
        color: var(--text-muted);
      }

      .subsection {
        margin-top: 18px;
      }

      .subsection h4 {
        margin: 0 0 10px;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .badge,
      .method-pill,
      .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .badge-version {
        background: var(--accent-soft);
        color: #1d4ed8;
      }

      .badge-internal {
        background: #fef3c7;
        color: #92400e;
      }

      .badge-media {
        background: var(--surface-muted);
        color: var(--text-muted);
      }

      .badge-req {
        background: #fee2e2;
        color: #b91c1c;
      }

      .badge-opt {
        background: var(--surface-muted);
        color: var(--text-muted);
      }

      .method-pill {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: 0.03em;
      }

      .method-get {
        background: #dcfce7;
        color: #166534;
      }

      .method-post {
        background: #dbeafe;
        color: #1e40af;
      }

      .method-put,
      .method-patch {
        background: #fef3c7;
        color: #92400e;
      }

      .method-delete {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-2xx {
        background: #dcfce7;
        color: #166534;
      }

      .status-4xx {
        background: #fef3c7;
        color: #92400e;
      }

      .status-5xx {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-other {
        background: var(--surface-muted);
        color: var(--text-muted);
      }

      .media-block {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 10px;
        background: #fcfcfd;
      }

      .media-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .schema-type {
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .responses-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .response-item {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px 14px;
      }

      .response-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .response-desc {
        font-size: 0.9rem;
        font-weight: 500;
      }

      .table-wrap {
        overflow-x: auto;
        margin: 8px 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.84rem;
      }

      th,
      td {
        text-align: left;
        padding: 8px 10px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }

      th {
        background: var(--surface-muted);
        font-weight: 600;
        color: var(--text-muted);
      }

      .raw-toggle {
        margin-top: 8px;
      }

      .raw-toggle summary {
        cursor: pointer;
        font-size: 0.8125rem;
        color: var(--accent);
        font-weight: 600;
      }

      pre {
        margin: 8px 0 0;
        padding: 12px 14px;
        border-radius: 8px;
        background: var(--code-bg);
        color: var(--code-text);
        overflow-x: auto;
        font-size: 0.8125rem;
        line-height: 1.5;
      }

      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: static;
          height: auto;
          border-right: none;
          border-bottom: 1px solid var(--border);
        }

        .main {
          padding: 20px 16px 48px;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="sidebar" aria-label="API ナビゲーション">
        <div class="sidebar-title">Endpoints</div>
        <ul class="nav-list">
          ${endpointNavLinks}
        </ul>
        <div class="sidebar-title">Schemas</div>
        <ul class="nav-list">
          ${schemaNavLinks}
        </ul>
      </aside>

      <main class="main">
        <header class="hero">
          <div class="hero-badges">
            <span class="badge badge-version">OpenAPI ${escapeHtml(openapiVersion)}</span>
            <span class="badge badge-version">v${escapeHtml(version)}</span>
            <span class="badge badge-internal">Internal BFF Only (本番非公開)</span>
          </div>
          <h1>${escapeHtml(title)}</h1>
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
          <div class="hero-actions">
            <button type="button" class="btn btn-primary" id="download-json-btn">
              bff-api.openapi.json をダウンロード
            </button>
            <button type="button" class="btn" id="copy-json-btn">OpenAPI JSON をコピー</button>
            <span class="copy-feedback" id="copy-feedback" aria-live="polite"></span>
          </div>
        </header>

        <h2 class="section-heading">Endpoints</h2>
        ${endpointCards}

        <h2 class="section-heading">Component Schemas</h2>
        ${schemaCards}

        <h2 class="section-heading">Raw OpenAPI Document (JSON)</h2>
        <div class="card">
          <details class="raw-toggle">
            <summary>OpenAPI 3.1.0 JSON 全体を表示</summary>
            <pre><code>${escapeHtml(JSON.stringify(document, null, 2))}</code></pre>
          </details>
        </div>
      </main>
    </div>

    <script id="openapi-spec" type="application/json">
${embeddedJson}
    </script>
    <script>
      (() => {
        const specElement = document.getElementById("openapi-spec");
        const rawSpecText = specElement ? specElement.textContent.trim() : "{}";
        const copyBtn = document.getElementById("copy-json-btn");
        const downloadBtn = document.getElementById("download-json-btn");
        const feedback = document.getElementById("copy-feedback");

        if (copyBtn) {
          copyBtn.addEventListener("click", async () => {
            try {
              await navigator.clipboard.writeText(rawSpecText);
              if (feedback) feedback.textContent = "コピーしました";
            } catch {
              if (feedback) feedback.textContent = "コピーに失敗しました";
            }
          });
        }

        if (downloadBtn) {
          downloadBtn.addEventListener("click", () => {
            const blob = new Blob([rawSpecText + "\\n"], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "bff-api.openapi.json";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
          });
        }
      })();
    </script>
  </body>
</html>
`;
}
