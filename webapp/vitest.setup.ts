/**
 * @file Vitest setup to suppress console logs during test execution
 */
import { beforeEach, vi } from "vitest";

// Suppress console logs during tests to reduce noise
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
