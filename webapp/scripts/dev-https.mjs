import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import next from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const shutdownTimeoutMs = 5000;

function isMainModule() {
  return process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export function registerGracefulShutdown({
  app,
  server,
  signals = ["SIGINT", "SIGTERM"],
  timeoutMs = shutdownTimeoutMs,
  processRef = process,
  setTimeoutRef = setTimeout,
  clearTimeoutRef = clearTimeout,
  consoleRef = console,
  closeServerRef = closeServer,
  exitRef = (code) => process.exit(code),
}) {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    consoleRef.log(`Received ${signal}. Shutting down HTTPS dev server...`);

    const timeoutId = setTimeoutRef(() => {
      consoleRef.error(`Graceful shutdown timed out after ${timeoutMs}ms.`);
      server.closeAllConnections?.();
      exitRef(1);
    }, timeoutMs);

    try {
      await closeServerRef(server);
      await app.close?.();
      clearTimeoutRef(timeoutId);
      exitRef(0);
    } catch (error) {
      clearTimeoutRef(timeoutId);
      consoleRef.error("Failed to shut down HTTPS dev server gracefully.", error);
      exitRef(1);
    }
  };

  for (const signal of signals) {
    processRef.on(signal, () => {
      void shutdown(signal);
    });
  }

  return shutdown;
}

export async function startDevHttpsServer() {
  const port = Number(process.env.HTTPS_PORT ?? 3000);
  const hostname = process.env.HTTPS_HOST ?? "localhost";
  const certFile = process.env.HTTPS_CERT_FILE ?? path.join(rootDir, "certs", "localhost.pem");
  const keyFile = process.env.HTTPS_KEY_FILE ?? path.join(rootDir, "certs", "localhost-key.pem");

  const app = next({ dev: true, hostname, port });
  const handle = app.getRequestHandler();

  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    console.error("HTTPS cert/key not found.");
    console.error("Expected:", certFile, keyFile);
    process.exit(1);
  }

  await app.prepare();

  const server = https.createServer(
    {
      cert: fs.readFileSync(certFile),
      key: fs.readFileSync(keyFile),
    },
    (req, res) => handle(req, res),
  );

  registerGracefulShutdown({ app, server });

  await new Promise((resolve, reject) => {
    const handleError = (error) => {
      server.off("error", handleError);
      reject(error);
    };

    server.once("error", handleError);
    server.listen(port, hostname, () => {
      server.off("error", handleError);
      console.log(`HTTPS dev server: https://${hostname}:${port}`);
      resolve();
    });
  });
}

if (isMainModule()) {
  await startDevHttpsServer();
}
