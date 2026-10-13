/**
 * server.js — HTTP server entry point
 *
 * - Validates required environment variables on startup
 * - Starts the Express server
 * - Implements graceful shutdown on SIGTERM / SIGINT
 *   (PM2 sends SIGTERM; Ctrl-C sends SIGINT)
 *
 * Credentials are NEVER logged. The log line for S3 bucket
 * only prints the bucket name (not secret) to confirm config.
 */

import "dotenv/config";
import app from "./app.js";

// ── Startup validation ────────────────────────────────────────────────────────
const REQUIRED_ENV = ["AWS_REGION", "S3_BUCKET_NAME"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error(
    `[CloudDrop] FATAL: Missing required environment variables: ${missing.join(", ")}\n` +
      `  Copy server/.env.example to server/.env and fill in the values.`
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "5000", 10);

// ── Start server ───────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[CloudDrop] Server running on http://localhost:${PORT}`);
  console.log(`[CloudDrop] AWS Region : ${process.env.AWS_REGION}`);
  console.log(`[CloudDrop] S3 Bucket  : ${process.env.S3_BUCKET_NAME}`);
  console.log(`[CloudDrop] CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
  console.log(`[CloudDrop] Health     : http://localhost:${PORT}/api/health`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n[CloudDrop] Received ${signal}. Shutting down gracefully…`);
  server.close((err) => {
    if (err) {
      console.error("[CloudDrop] Error during shutdown:", err.message);
      process.exit(1);
    }
    console.log("[CloudDrop] Server closed. Goodbye.");
    process.exit(0);
  });

  // Force exit after 10 s if connections don't drain
  setTimeout(() => {
    console.error("[CloudDrop] Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[CloudDrop] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[CloudDrop] Uncaught exception:", err.message);
  process.exit(1);
});
