import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import next from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

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

https
  .createServer(
    {
      cert: fs.readFileSync(certFile),
      key: fs.readFileSync(keyFile),
    },
    (req, res) => handle(req, res),
  )
  .listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`HTTPS dev server: https://${hostname}:${port}`);
  });
