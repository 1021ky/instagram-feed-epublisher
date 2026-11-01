import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

export function stripAnsi(text: string): string;

export default class PlaywrightSummaryReporter implements Reporter {
  constructor(options?: { outputFile?: string; printSummary?: boolean });
  onBegin(config: FullConfig): void;
  onTestEnd(test: TestCase, result: TestResult): void;
  onEnd(result: FullResult): void;
}
