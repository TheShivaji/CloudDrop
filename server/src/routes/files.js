/**
 * routes/files.js — All /api/files endpoints
 *
 * Endpoints:
 *  GET    /api/files                  — list all uploaded files
 *  POST   /api/files/upload           — upload a file to S3
 *  GET    /api/files/download/:token  — generate a presigned download URL
 *  DELETE /api/files/:token           — delete a file from S3
 *
 * Key encoding:
 *  S3 keys look like "uploads/uuid-filename.pdf" and contain a slash.
 *  Passing a slash in a URL path parameter breaks Express routing.
 *  Solution: when listing files the server returns a base64url-encoded
 *  "token" for each key. The client sends this token for download/delete.
 *  The server decodes and validates the token before touching S3.
 *
 * Security:
 *  - Every key is validated to start with "uploads/" (the only prefix
 *    this application ever writes). This prevents arbitrary key access.
 *  - Upload concurrency is capped at MAX_CONCURRENT_UPLOADS.
 *  - Presigned URLs expire after 15 minutes.
 *  - File name is sanitised before building the S3 key.
 */

import { Router } from "express";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

import s3Client from "../config/s3.js";
import upload from "../middleware/upload.js";

const router = Router();
const BUCKET = process.env.S3_BUCKET_NAME;
const KEY_PREFIX = "uploads/";
const PRESIGN_EXPIRES = 15 * 60; // 15 minutes in seconds

// ── Concurrency guard ─────────────────────────────────────────────────────────
let activeUploads = 0;
const MAX_CONCURRENT_UPLOADS = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sanitise an original filename:
 *  - Remove path separators (prevent traversal)
 *  - Replace spaces and special chars with underscores
 *  - Limit total length
 */
function sanitiseFilename(name) {
  return name
    .replace(/[/\\]/g, "") // strip path separators
    .replace(/[^a-zA-Z0-9._-]/g, "_") // allow safe chars only
    .slice(0, 200); // cap length
}

/**
 * Build the S3 key for a new upload.
 * Format: uploads/<uuid>-<sanitised-filename>
 */
function buildS3Key(originalName) {
  const safe = sanitiseFilename(originalName);
  return `${KEY_PREFIX}${uuidv4()}-${safe}`;
}

/** Encode an S3 key to a URL-safe token. */
function encodeKey(key) {
  return Buffer.from(key).toString("base64url");
}

/** Decode a token back to an S3 key and validate its prefix. */
function decodeAndValidateToken(token) {
  let key;
  try {
    key = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }
  // Only allow keys this application created (under the uploads/ prefix)
  if (!key.startsWith(KEY_PREFIX)) return null;
  // Guard against path traversal attempts in the decoded key
  if (key.includes("..")) return null;
  return key;
}

/** Format bytes to a human-readable string. */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

// ── GET /api/files ─────────────────────────────────────────────────────────────
router.get("/", async (_req, res, next) => {
  try {
    const files = [];
    let continuationToken;

    // Paginate through all objects in the prefix
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: KEY_PREFIX,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      for (const obj of response.Contents ?? []) {
        // Skip the "folder" placeholder object if it exists
        if (obj.Key === KEY_PREFIX) continue;

        const keyToken = encodeKey(obj.Key);
        const rawName = obj.Key.slice(KEY_PREFIX.length).replace(
          /^[0-9a-f-]{36}-/i,
          ""
        );

        files.push({
          key: keyToken,
          name: rawName,
          size: obj.Size,
          sizeFormatted: formatBytes(obj.Size),
          lastModified: obj.LastModified,
          storageClass: obj.StorageClass || "STANDARD",
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Sort newest first
    files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    res.json({
      files,
      summary: {
        count: files.length,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/files/upload ─────────────────────────────────────────────────────
router.post(
  "/upload",
  (req, res, next) => {
    // Concurrency gate — checked before Multer parses the body
    if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
      return res.status(429).json({
        error: `Server is busy. Maximum ${MAX_CONCURRENT_UPLOADS} concurrent uploads allowed. Please try again shortly.`,
      });
    }
    next();
  },
  upload.single("file"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file was provided." });
    }

    activeUploads++;
    const key = buildS3Key(req.file.originalname);

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ContentLength: req.file.size,
          // No ACL — bucket policy enforces private access
          Metadata: {
            "original-name": req.file.originalname.slice(0, 500),
          },
        })
      );

      console.log(
        `[Upload] SUCCESS key=${key} size=${req.file.size} type=${req.file.mimetype}`
      );

      res.status(201).json({
        message: "File uploaded successfully.",
        file: {
          key: encodeKey(key),
          name: req.file.originalname,
          size: req.file.size,
          sizeFormatted: formatBytes(req.file.size),
          contentType: req.file.mimetype,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error(`[Upload] FAILED key=${key} error=${err.message}`);
      next(err);
    } finally {
      activeUploads--;
    }
  }
);

// ── GET /api/files/download/:token ────────────────────────────────────────────
router.get("/download/:token", async (req, res, next) => {
  const key = decodeAndValidateToken(req.params.token);

  if (!key) {
    return res.status(400).json({
      error: "Invalid file token.",
    });
  }

  try {
    // Verify the object exists before signing (gives a clear 404 vs S3 error)
    await s3Client.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRES,
    });

    console.log(`[Download] Presigned URL generated key=${key} expires=${PRESIGN_EXPIRES}s`);

    // Redirect browser to the presigned URL.
    // The bucket stays private — the URL carries a time-limited signature.
    res.redirect(302, presignedUrl);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/files/:token ───────────────────────────────────────────────────
router.delete("/:token", async (req, res, next) => {
  const key = decodeAndValidateToken(req.params.token);

  if (!key) {
    return res.status(400).json({
      error: "Invalid file token.",
    });
  }

  try {
    // Confirm the object exists before deleting (proper 404 if missing)
    await s3Client.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );

    await s3Client.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    );

    console.log(`[Delete] SUCCESS key=${key}`);
    res.json({ message: "File deleted successfully." });
  } catch (err) {
    next(err);
  }
});

export default router;
