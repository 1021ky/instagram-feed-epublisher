export const DEFAULT_OUTPUT_DIR: string;
export const OPENAPI_JSON_FILENAME: string;
export const OPENAPI_HTML_FILENAME: string;
export const INSTAGRAM_OPENAPI_SPEC_PATH: string;
export const REDOCLY_CONFIG_PATH: string;

export function createBffOpenApiJson(): Promise<{
  document: Record<string, unknown>;
  jsonContent: string;
}>;

export function generateBffOpenApiJsonFile(options?: { outputDir?: string }): Promise<{
  document: Record<string, unknown>;
  jsonPath: string;
}>;

export function generateBffOpenApiFiles(options?: { outputDir?: string }): Promise<{
  jsonPath: string;
  htmlPath: string;
}>;

export function lintOpenApiSpecs(): Promise<void>;
