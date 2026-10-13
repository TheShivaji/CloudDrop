/**
 * filesApi.js — All HTTP calls to the CloudDrop backend.
 *
 * Base URL strategy:
 *  - VITE_API_BASE_URL is intentionally left empty in both dev and prod.
 *  - In dev:  Vite proxies /api → localhost:5000 (see vite.config.js).
 *  - In prod: Nginx proxies /api → localhost:5000 on the same EC2 host.
 *  - If VITE_API_BASE_URL is set (different domain), it is used as a prefix.
 *
 * AWS credentials NEVER appear here. The backend handles all S3 operations.
 */

import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 30_000,
});

// ── Response interceptor — unwrap data or surface error message ───────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred.";
    return Promise.reject(new Error(message));
  }
);

// ── API methods ───────────────────────────────────────────────────────────────

/** Fetch the list of all uploaded files and storage summary. */
export const fetchFiles = () => api.get("/files");

/**
 * Upload a file with progress tracking.
 * @param {File} file
 * @param {(pct: number) => void} onProgress - called with 0-100
 */
export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000, // 2 min for large files
    onUploadProgress: (event) => {
      if (event.total) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress?.(pct);
      }
    },
  });
};

/**
 * Trigger a download for a file.
 * The backend generates a presigned S3 URL and redirects.
 * We open the redirect target URL in a new tab.
 * @param {string} token - base64url-encoded S3 key from the file list
 */
export const downloadFile = (token) => {
  // Open the /api/files/download/:token URL — the browser follows the 302
  // redirect to the presigned S3 URL. No credentials are exposed.
  const url = `${BASE}/api/files/download/${encodeURIComponent(token)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

/**
 * Delete a file by its token.
 * @param {string} token - base64url-encoded S3 key
 */
export const deleteFile = (token) => api.delete(`/files/${encodeURIComponent(token)}`);

/** Check API server health. */
export const checkHealth = () => api.get("/health");
