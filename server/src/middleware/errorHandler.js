/**
 * errorHandler.js — Central Express error-handling middleware
 *
 * Must have exactly 4 parameters so Express recognises it as an
 * error handler (err, req, res, next).
 *
 * Handles:
 *  - Multer errors (file size, unexpected field, MIME type)
 *  - AWS SDK errors (credentials, not found, etc.)
 *  - Generic application errors
 *
 * Never logs AWS credentials, request bodies, or file contents.
 */

import multer from "multer";

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Log method + path for tracing — never log bodies or auth headers
  console.error(
    `[ErrorHandler] ${req.method} ${req.path} →`,
    err.name || "Error",
    ":",
    err.message
  );

  // ── Multer: file too large ────────────────────────────────────────────────
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File exceeds the 100 MB size limit.",
    });
  }

  // ── Multer: unexpected field name (or our MIME rejection injected) ────────
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  // ── AWS: object not found ────────────────────────────────────────────────
  if (
    err.name === "NoSuchKey" ||
    err.$metadata?.httpStatusCode === 404
  ) {
    return res.status(404).json({ error: "File not found in storage." });
  }

  // ── AWS: credentials could not be resolved ───────────────────────────────
  if (
    err.name === "CredentialsProviderError" ||
    err.name === "ExpiredTokenException" ||
    err.name === "InvalidClientTokenId"
  ) {
    return res.status(500).json({
      error:
        "AWS credentials could not be resolved. " +
        "On EC2, ensure an IAM role is attached to the instance. " +
        "For local development, run `aws configure` or export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.",
    });
  }

  // ── AWS: access denied ───────────────────────────────────────────────────
  if (err.name === "AccessDenied" || err.$metadata?.httpStatusCode === 403) {
    return res.status(403).json({
      error:
        "S3 access denied. Check that the IAM role has the required S3 permissions.",
    });
  }

  // ── MIME-type rejection from fileFilter ──────────────────────────────────
  if (err.status === 415) {
    return res.status(415).json({ error: err.message });
  }

  // ── Generic ──────────────────────────────────────────────────────────────
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "An unexpected server error occurred.",
  });
};

export default errorHandler;
