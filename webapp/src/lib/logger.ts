/**
 * @file Logging infrastructure using LogTape + Winston.
 */
import { configure, getLogger as getLogTapeLogger } from "@logtape/logtape";
import { getWinstonSink } from "@logtape/adaptor-winston";
import winston from "winston";
import path from "node:path";

const logLevel = (process.env.LOG_LEVEL ?? "info") as
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "fatal";

const isDevelopment = process.env.NODE_ENV !== "production";

// Winston transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    ),
  }),
];

// Add file transport for development
if (isDevelopment) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const logFilePath = path.join(process.cwd(), "logs", `${today}.log`);

  transports.push(
    new winston.transports.File({
      filename: logFilePath,
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );
}

// Create Winston logger
const winstonLogger = winston.createLogger({
  level: logLevel === "warning" ? "warn" : logLevel,
  transports,
});

// LogTapeの設定が既に行われているかを追跡するフラグ
let isLogTapeConfigured = false;

// Configure LogTape with Winston sink (テスト環境で複数回実行されないように)
if (!isLogTapeConfigured) {
  await configure({
    sinks: {
      winston: getWinstonSink(winstonLogger, {
        category: {
          separator: ".",
          position: "start",
          decorator: "[]",
        },
      }),
    },
    loggers: [
      {
        category: [],
        lowestLevel: logLevel,
        sinks: ["winston"],
      },
    ],
  });
  isLogTapeConfigured = true;
}

/**
 * Get a logger instance for the specified category.
 *
 * @param category - Logger category (e.g., "instagram.graph-client")
 * @returns Logger instance
 */
export function getLogger(category: string | string[]) {
  const categoryArray = typeof category === "string" ? [category] : category;
  return getLogTapeLogger(categoryArray);
}
