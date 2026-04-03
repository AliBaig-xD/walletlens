import { logger } from "./utils/logger.js";
import { startServer, gracefulShutdown } from "./server.js";

async function start() {
  try {
    logger.info("Starting WalletLens API...");
    await startServer();
    logger.info("WalletLens API started successfully");
  } catch (error) {
    logger.error("Failed to start", { error });
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down...`);
  await gracefulShutdown();
  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error });
  void shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason });
  void shutdown("unhandledRejection");
});

void start();
