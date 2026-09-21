import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerGracefulShutdown } from "./dev-https.mjs";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("registerGracefulShutdown", () => {
  it("closes the server and app before exiting successfully", async () => {
    const processRef = new EventEmitter();
    const events: string[] = [];
    const server = {
      closeAllConnections: vi.fn(),
    };
    const app = {
      close: vi.fn(async () => {
        events.push("app.close");
      }),
    };
    const closeServerRef = vi.fn(async () => {
      events.push("server.close");
    });
    const exitRef = vi.fn((code: number) => {
      events.push(`exit:${code}`);
    });
    const consoleRef = {
      log: vi.fn(),
      error: vi.fn(),
    };

    registerGracefulShutdown({
      app,
      server,
      processRef: processRef as typeof process,
      closeServerRef,
      exitRef,
      consoleRef,
    });

    processRef.emit("SIGINT");

    await vi.waitFor(() => {
      expect(exitRef).toHaveBeenCalledWith(0);
    });

    expect(closeServerRef).toHaveBeenCalledWith(server);
    expect(app.close).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["server.close", "app.close", "exit:0"]);
    expect(consoleRef.log).toHaveBeenCalledWith(
      "Received SIGINT. Shutting down HTTPS dev server...",
    );
    expect(consoleRef.error).not.toHaveBeenCalled();
  });

  it("forces exit with code 1 when shutdown exceeds the timeout", async () => {
    vi.useFakeTimers();

    const processRef = new EventEmitter();
    const server = {
      closeAllConnections: vi.fn(),
    };
    const app = {
      close: vi.fn(),
    };
    const closeServerRef = vi.fn(() => new Promise<void>(() => {}));
    const exitRef = vi.fn();
    const consoleRef = {
      log: vi.fn(),
      error: vi.fn(),
    };

    registerGracefulShutdown({
      app,
      server,
      processRef: processRef as typeof process,
      timeoutMs: 5_000,
      closeServerRef,
      exitRef,
      consoleRef,
    });

    processRef.emit("SIGTERM");
    await vi.advanceTimersByTimeAsync(5_000);

    expect(server.closeAllConnections).toHaveBeenCalledTimes(1);
    expect(exitRef).toHaveBeenCalledWith(1);
    expect(exitRef).not.toHaveBeenCalledWith(0);
    expect(consoleRef.error).toHaveBeenCalledWith("Graceful shutdown timed out after 5000ms.");
    expect(app.close).not.toHaveBeenCalled();
  });

  it("ignores additional signals after shutdown has started", async () => {
    const processRef = new EventEmitter();
    let resolveShutdown: (() => void) | undefined;
    const closeServerRef = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveShutdown = resolve;
        }),
    );
    const app = {
      close: vi.fn(async () => {}),
    };
    const exitRef = vi.fn();

    registerGracefulShutdown({
      app,
      server: { closeAllConnections: vi.fn() },
      processRef: processRef as typeof process,
      closeServerRef,
      exitRef,
      consoleRef: { log: vi.fn(), error: vi.fn() },
    });

    processRef.emit("SIGINT");
    processRef.emit("SIGTERM");

    expect(closeServerRef).toHaveBeenCalledTimes(1);

    resolveShutdown?.();

    await vi.waitFor(() => {
      expect(exitRef).toHaveBeenCalledWith(0);
    });
  });

  it("closes all connections and exits with code 1 when shutdown cleanup fails", async () => {
    const processRef = new EventEmitter();
    const server = {
      closeAllConnections: vi.fn(),
    };
    const closeServerRef = vi.fn(async () => {
      throw new Error("close failed");
    });
    const exitRef = vi.fn();
    const consoleRef = {
      log: vi.fn(),
      error: vi.fn(),
    };

    registerGracefulShutdown({
      app: { close: vi.fn() },
      server,
      processRef: processRef as typeof process,
      closeServerRef,
      exitRef,
      consoleRef,
    });

    processRef.emit("SIGTERM");

    await vi.waitFor(() => {
      expect(exitRef).toHaveBeenCalledWith(1);
    });

    expect(server.closeAllConnections).toHaveBeenCalledTimes(1);
    expect(consoleRef.error).toHaveBeenCalledWith(
      "Failed to shut down HTTPS dev server gracefully.",
      expect.any(Error),
    );
  });
});
