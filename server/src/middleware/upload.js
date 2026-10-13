/**
 * upload.js — Multer middleware
 *
 * Configuration:
 *  - Storage : memory (files never touch the disk)
 *  - Max size : 100 MB per file (enforced by Multer before S3)
 *  - MIME types: explicit allowlist (no wildcard accept-all)
 *
 * Note on MIME validation:
 *  Multer reads the Content-Type header sent by the browser.
 *  This is a first-pass check; it is not 100% tamper-proof because
 *  a client can lie about Content-Type. For stronger guarantees in
 *  production add a magic-bytes check using the `file-type` npm package
 *  after the buffer is available.
 */

import multer from "multer";

export const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  // Documents
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  // Office
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Archives
  "application/zip",
  "application/x-tar",
  "application/gzip",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  // Video
  "video/mp4",
  "video/webm",
  "video/ogg",
  // Code / data
  "application/json",
  "application/xml",
  "text/html",
  "text/javascript",
  "text/css",
]);

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    // Pass a plain Error so the error handler can format it cleanly
    cb(
      Object.assign(new Error(`File type "${file.mimetype}" is not allowed.`), {
        status: 415,
      }),
      false
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export default upload;
