import express, { Request, Response, NextFunction, Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import "dotenv/config";
import { env } from "./config/env.js";
import { logger, loggerStream } from "./utils/logger.js";
import { disconnectDatabase } from "./config/db.js";
import { disconnectRedis } from "./config/redis.js";
import apiV1Routes from "./api/v1/routes/index.js";
import { errorHandler } from "./api/v1/middleware/errors.js";
import { publicRateLimiter } from "./api/v1/middleware/rateLimit.js";

const app: Application = express();

// ─── Trust proxy — REQUIRED for MonkePay on Railway ───────────────────────────
app.set("trust proxy", 1);

// ─── Security ─────────────────────────────────────────────────────────────────
app.disable("x-powered-by");
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Handle JSON parse errors
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Invalid JSON body",
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  next(err);
});

// ─── Request logging ───────────────────────────────────────────────────────────
app.use(morgan("combined", { stream: loggerStream }));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
app.use(publicRateLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", apiV1Routes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler
app.use(errorHandler);

// ─── Server lifecycle ──────────────────────────────────────────────────────────
const PORT = env.PORT;
let server: ReturnType<typeof app.listen>;

export async function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      logger.info(`WalletLens API running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      resolve();
    });
  });
}

export async function gracefulShutdown(): Promise<void> {
  if (!server) return;

  return new Promise((resolve) => {
    server.close(async () => {
      logger.info("HTTP server closed");
      await disconnectDatabase();
      await disconnectRedis();
      logger.info("All connections closed");
      resolve();
    });

    setTimeout(() => {
      logger.error("Forcing shutdown after 30s timeout");
      process.exit(1);
    }, 30_000);
  });
}

export default app;
