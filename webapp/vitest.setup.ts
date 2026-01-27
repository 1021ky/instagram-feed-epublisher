/**
 * @file Vitest setup to suppress console logs during test execution
 */

// Suppress console logs during tests to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
