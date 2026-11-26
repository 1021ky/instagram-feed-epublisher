export const DEFAULT_OUTPUT_DIR: string;
export const OPENAPI_JSON_FILENAME: string;
export const OPENAPI_HTML_FILENAME: string;

export function createBffOpenApiArtifacts(): Promise<{
  document: Record<string, unknown>;
  jsonContent: string;
  htmlContent: string;
}>;

export function generateBffOpenApiFiles(options?: { outputDir?: string }): Promise<{
  jsonPath: string;
  htmlPath: string;
}>;

export function checkBffOpenApiFiles(options?: { outputDir?: string }): Promise<{
  upToDate: boolean;
  diffs: string[];
}>;
