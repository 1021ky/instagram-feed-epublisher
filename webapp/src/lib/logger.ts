/**
 * @file Logging infrastructure using LogTape + Winston.
 */
import { configure, getLogger as getLogTapeLogger } from "@logtape/logtape";
import { getWinstonSink } from "@logtape/adaptor-winston";
import winston from "winston";
import path from "node:path";

const isTest = process.env.NODE_ENV === "test";

const logLevel = (process.env.LOG_LEVEL ?? (isTest ? "fatal" : "info")) as
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "fatal";

const isDevelopment = process.env.NODE_ENV !== "production";

// Winston transports
const transports: winston.transport[] = [];

// Don't add console transport in test environment
if (!isTest) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
}

// Add file transport for development (but not test)
if (isDevelopment && !isTest) {
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
  const loggers: Array<{
    category: string[];
    lowestLevel: "debug" | "info" | "warning" | "error" | "fatal" | "trace";
    sinks: string[];
  }> = [
    {
      category: [],
      lowestLevel: logLevel,
      sinks: ["winston"],
    },
  ];

  // Suppress LogTape meta logger in test environment
  if (isTest) {
    loggers.push({
      category: ["logtape", "meta"],
      lowestLevel: "fatal",
      sinks: ["winston"],
    });
  }

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
    loggers,
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
