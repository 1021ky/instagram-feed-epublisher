/**
 * @file Module declarations for html-to-epub.
 */

declare module "@lesjoursfr/html-to-epub" {
  export class EPub {
    constructor(options: Record<string, unknown>, output?: string);
    render(): Promise<void>;
  }
}
