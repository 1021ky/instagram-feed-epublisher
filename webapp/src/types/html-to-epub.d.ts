/**
 * @file Module declarations for html-to-epub.
 */

declare module "@lesjoursfr/html-to-epub" {
  export interface EpubOptions {
    strictXhtml?: boolean;
    [key: string]: unknown;
  }

  export class EPub {
    constructor(options: EpubOptions, output?: string);
    render(): Promise<void>;
  }
}
