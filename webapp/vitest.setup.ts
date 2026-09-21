import React from "react";
import { beforeEach, vi } from "vitest";

// Ensure React is available globally for JSX in node test environment
(globalThis as unknown as { React: typeof React }).React = React;

// Suppress console logs during tests to reduce noise
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
