/**
 * @file Zero-dependency OpenAPI 3.1 contract loader and schema validator.
 *
 * Parses `docs/openapi/instagram-graph-api.openapi.yaml` and validates
 * upstream Meta Graph API / internal BFF payloads against `components.schemas`
 * in both the local Playwright E2E mock server and Vitest contract tests.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_OPENAPI_SPEC_PATH = path.resolve(
  __dirname,
  "../../docs/openapi/instagram-graph-api.openapi.yaml",
);

/**
 * Parses a YAML scalar token into a JavaScript primitive.
 *
 * @param {string} raw
 * @returns {string | number | boolean | null}
 */
function parseScalar(raw) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (/^-?\d+\.\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

/**
 * Splits a `key: value` line if it represents a YAML mapping entry.
 *
 * @param {string} text
 * @returns {{ key: string; rest: string } | null}
 */
function matchKeyValue(text) {
  if (text.startsWith('"')) {
    const endQuote = text.indexOf('"', 1);
    if (endQuote > 0 && text[endQuote + 1] === ":") {
      const key = text.slice(1, endQuote);
      const rest = text.slice(endQuote + 2).trim();
      return { key, rest };
    }
    return null;
  }

  const colonIdx = text.indexOf(":");
  if (colonIdx <= 0) return null;
  if (colonIdx + 1 < text.length && text[colonIdx + 1] !== " ") {
    return null;
  }

  const key = text.slice(0, colonIdx).trim();
  const rest = text.slice(colonIdx + 1).trim();
  return { key, rest };
}

/**
 * Lightweight 2-space block YAML parser tailored for OpenAPI 3.1 specifications.
 *
 * @param {string} yamlText
 * @returns {Record<string, unknown>}
 */
export function parseSimpleYaml(yamlText) {
  const lines = yamlText
    .split(/\r?\n/)
    .map((raw, idx) => {
      const match = raw.match(/^(\s*)(.*)$/);
      const indent = match ? match[1].length : 0;
      const content = match ? match[2].trimEnd() : "";
      return { lineNumber: idx + 1, indent, content };
    })
    .filter((line) => line.content.length > 0 && !line.content.startsWith("#"));

  let index = 0;

  /**
   * @param {number} expectedIndent
   * @returns {unknown}
   */
  function parseBlock(expectedIndent) {
    if (index >= lines.length) return {};
    const first = lines[index];
    if (first.indent < expectedIndent) return {};

    if (first.content.startsWith("- ") || first.content === "-") {
      /** @type {unknown[]} */
      const arr = [];
      while (index < lines.length) {
        const current = lines[index];
        if (current.indent < expectedIndent) break;
        if (current.indent > expectedIndent) {
          throw new Error(`Unexpected indentation at YAML line ${current.lineNumber}`);
        }
        if (!current.content.startsWith("- ") && current.content !== "-") {
          break;
        }

        const afterDash = current.content === "-" ? "" : current.content.slice(2).trim();
        index += 1;

        if (afterDash === "") {
          arr.push(parseBlock(expectedIndent + 2));
          continue;
        }

        const kv = matchKeyValue(afterDash);
        if (kv) {
          /** @type {Record<string, unknown>} */
          const itemObj = {};
          if (kv.rest === "") {
            itemObj[kv.key] = parseBlock(expectedIndent + 4);
          } else {
            itemObj[kv.key] = parseScalar(kv.rest);
          }

          if (index < lines.length && lines[index].indent === expectedIndent + 2) {
            const extra = parseObjectEntries(expectedIndent + 2);
            Object.assign(itemObj, extra);
          }
          arr.push(itemObj);
        } else {
          arr.push(parseScalar(afterDash));
        }
      }
      return arr;
    }

    return parseObjectEntries(expectedIndent);
  }

  /**
   * @param {number} expectedIndent
   * @returns {Record<string, unknown>}
   */
  function parseObjectEntries(expectedIndent) {
    /** @type {Record<string, unknown>} */
    const obj = {};
    while (index < lines.length) {
      const current = lines[index];
      if (current.indent < expectedIndent) break;
      if (current.indent > expectedIndent) {
        throw new Error(`Unexpected indentation at YAML line ${current.lineNumber}`);
      }
      if (current.content.startsWith("- ") || current.content === "-") {
        break;
      }

      const kv = matchKeyValue(current.content);
      if (!kv) {
        throw new Error(
          `Expected mapping entry at YAML line ${current.lineNumber}: ${current.content}`,
        );
      }

      index += 1;
      if (kv.rest === "") {
        if (index < lines.length && lines[index].indent > expectedIndent) {
          obj[kv.key] = parseBlock(lines[index].indent);
        } else {
          obj[kv.key] = {};
        }
      } else {
        obj[kv.key] = parseScalar(kv.rest);
      }
    }
    return obj;
  }

  const parsed = parseBlock(0);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("OpenAPI root document must be an object");
  }
  return /** @type {Record<string, unknown>} */ (parsed);
}

/**
 * Loads and parses the Instagram OpenAPI 3.1 specification.
 *
 * @param {string} [specPath]
 * @returns {Record<string, any>}
 */
export function loadInstagramOpenApiSpec(specPath = DEFAULT_OPENAPI_SPEC_PATH) {
  const raw = fs.readFileSync(specPath, "utf8");
  return parseSimpleYaml(raw);
}

/**
 * Resolves a `$ref` pointer within the OpenAPI document.
 *
 * @param {Record<string, any>} spec
 * @param {Record<string, any>} schemaOrRef
 * @returns {Record<string, any>}
 */
function resolveSchemaRef(spec, schemaOrRef) {
  if (!schemaOrRef || typeof schemaOrRef !== "object") {
    throw new Error("Invalid schema node");
  }
  if (typeof schemaOrRef.$ref === "string") {
    const prefix = "#/components/schemas/";
    if (!schemaOrRef.$ref.startsWith(prefix)) {
      throw new Error(`Unsupported $ref pointer: ${schemaOrRef.$ref}`);
    }
    const targetName = schemaOrRef.$ref.slice(prefix.length);
    const resolved = spec?.components?.schemas?.[targetName];
    if (!resolved) {
      throw new Error(`Schema not found for $ref: ${schemaOrRef.$ref}`);
    }
    return resolveSchemaRef(spec, resolved);
  }
  return schemaOrRef;
}

/**
 * Validates a value against a named schema in `components.schemas`.
 *
 * @param {Record<string, any>} spec
 * @param {string} schemaName
 * @param {unknown} value
 * @returns {{ valid: boolean; errors: string[] }}
 */
export function validateOpenApiSchema(spec, schemaName, value) {
  const rootSchema = spec?.components?.schemas?.[schemaName];
  if (!rootSchema) {
    return {
      valid: false,
      errors: [`Unknown OpenAPI schema: ${schemaName}`],
    };
  }

  /** @type {string[]} */
  const errors = [];

  /**
   * @param {Record<string, any>} rawSchema
   * @param {unknown} current
   * @param {string} pointer
   */
  function visit(rawSchema, current, pointer) {
    const schema = resolveSchemaRef(spec, rawSchema);

    if (schema.enum && Array.isArray(schema.enum)) {
      if (!schema.enum.includes(current)) {
        errors.push(
          `${pointer}: expected one of [${schema.enum.join(", ")}], got ${String(current)}`,
        );
      }
    }

    switch (schema.type) {
      case "object": {
        if (current === null || typeof current !== "object" || Array.isArray(current)) {
          errors.push(`${pointer}: expected object`);
          return;
        }
        const record = /** @type {Record<string, unknown>} */ (current);
        const properties = schema.properties ?? {};
        const required = Array.isArray(schema.required) ? schema.required : [];

        for (const reqKey of required) {
          if (!(reqKey in record) || record[reqKey] === undefined) {
            errors.push(`${pointer}.${reqKey}: required property is missing`);
          }
        }

        if (schema.additionalProperties === false) {
          for (const key of Object.keys(record)) {
            if (!(key in properties)) {
              errors.push(`${pointer}.${key}: additional property is not allowed`);
            }
          }
        }

        for (const [propKey, propSchema] of Object.entries(properties)) {
          if (propKey in record && record[propKey] !== undefined) {
            visit(
              /** @type {Record<string, any>} */ (propSchema),
              record[propKey],
              `${pointer}.${propKey}`,
            );
          }
        }
        break;
      }

      case "array": {
        if (!Array.isArray(current)) {
          errors.push(`${pointer}: expected array`);
          return;
        }
        if (schema.items) {
          current.forEach((item, idx) => {
            visit(schema.items, item, `${pointer}[${idx}]`);
          });
        }
        break;
      }

      case "string": {
        if (typeof current !== "string") {
          errors.push(`${pointer}: expected string`);
          return;
        }
        if (typeof schema.minLength === "number" && current.length < schema.minLength) {
          errors.push(
            `${pointer}: string length ${current.length} is less than minLength ${schema.minLength}`,
          );
        }
        if (schema.format === "date-time" && Number.isNaN(Date.parse(current))) {
          errors.push(`${pointer}: invalid date-time format "${current}"`);
        }
        if (schema.format === "uri") {
          try {
            new URL(current);
          } catch {
            errors.push(`${pointer}: invalid uri format "${current}"`);
          }
        }
        break;
      }

      case "integer": {
        if (typeof current !== "number" || !Number.isInteger(current)) {
          errors.push(`${pointer}: expected integer`);
          return;
        }
        if (typeof schema.minimum === "number" && current < schema.minimum) {
          errors.push(`${pointer}: value ${current} is less than minimum ${schema.minimum}`);
        }
        if (typeof schema.maximum === "number" && current > schema.maximum) {
          errors.push(`${pointer}: value ${current} is greater than maximum ${schema.maximum}`);
        }
        break;
      }

      case "number": {
        if (typeof current !== "number" || !Number.isFinite(current)) {
          errors.push(`${pointer}: expected finite number`);
          return;
        }
        if (typeof schema.minimum === "number" && current < schema.minimum) {
          errors.push(`${pointer}: value ${current} is less than minimum ${schema.minimum}`);
        }
        if (typeof schema.maximum === "number" && current > schema.maximum) {
          errors.push(`${pointer}: value ${current} is greater than maximum ${schema.maximum}`);
        }
        break;
      }

      case "boolean": {
        if (typeof current !== "boolean") {
          errors.push(`${pointer}: expected boolean`);
        }
        break;
      }

      default:
        break;
    }
  }

  visit(rootSchema, value, schemaName);
  return { valid: errors.length === 0, errors };
}

/**
 * Throws an Error if `value` does not conform to `schemaName` in `spec`.
 *
 * @param {Record<string, any>} spec
 * @param {string} schemaName
 * @param {unknown} value
 */
export function assertValidOpenApiSchema(spec, schemaName, value) {
  const result = validateOpenApiSchema(spec, schemaName, value);
  if (!result.valid) {
    throw new Error(
      `OpenAPI contract violation for ${schemaName}:\n- ${result.errors.join("\n- ")}`,
    );
  }
}
