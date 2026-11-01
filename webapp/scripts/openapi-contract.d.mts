export const DEFAULT_OPENAPI_SPEC_PATH: string;

export function parseSimpleYaml(yamlText: string): Record<string, unknown>;

export function loadInstagramOpenApiSpec(specPath?: string): Record<string, unknown>;

export function validateOpenApiSchema(
  spec: Record<string, unknown>,
  schemaName: string,
  value: unknown,
): {
  valid: boolean;
  errors: string[];
};

export function assertValidOpenApiSchema(
  spec: Record<string, unknown>,
  schemaName: string,
  value: unknown,
): void;
