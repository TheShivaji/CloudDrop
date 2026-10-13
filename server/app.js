/**
 * app.js — Express application factory
 *
 * Responsibilities:
 *  - Configure CORS (reads CORS_ORIGIN from env)
 *  - Parse JSON and URL-encoded bodies
 *  - Mount API routes
 *  - Mount central error handler
 *
 * The HTTP server is created in server.js so that graceful
 * shutdown logic stays in one place.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import filesRouter from "./src/routes/files.js";
import errorHandler from "./src/middleware/errorHandler.js";

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Only allow the configured origin. In production this will be your domain.
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "clouddrop-server",
    timestamp: new Date().toISOString(),
    region: process.env.AWS_REGION || "not set",
    bucket: process.env.S3_BUCKET_NAME ? "configured" : "not set",
  });
});

// ── File routes ────────────────────────────────────────────────────────────────
app.use("/api/files", filesRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Central error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
