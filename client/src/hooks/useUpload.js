/**
 * useUpload.js — Hook for uploading files with per-file progress tracking.
 *
 * Supports multiple simultaneous uploads.
 * Calls onSuccess(fileData) after each successful upload.
 */

import { useState, useCallback } from "react";
import { uploadFile } from "../api/filesApi";

export function useUpload({ onSuccess } = {}) {
  // Map of filename → { progress, status, error }
  const [uploads, setUploads] = useState({});

  const updateUpload = useCallback((name, patch) => {
    setUploads((prev) => ({
      ...prev,
      [name]: { ...(prev[name] || {}), ...patch },
    }));
  }, []);

  const upload = useCallback(
    async (file) => {
      const name = file.name;
      updateUpload(name, { progress: 0, status: "uploading", error: null });

      try {
        const data = await uploadFile(file, (pct) => {
          updateUpload(name, { progress: pct });
        });

        updateUpload(name, { progress: 100, status: "done" });
        onSuccess?.(data.file);

        // Auto-clear the entry after a short delay
        setTimeout(() => {
          setUploads((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }, 3000);
      } catch (err) {
        updateUpload(name, { status: "error", error: err.message });
      }
    },
    [updateUpload, onSuccess]
  );

  const uploadMany = useCallback(
    (files) => {
      Array.from(files).forEach((f) => upload(f));
    },
    [upload]
  );

  const clearError = useCallback((name) => {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const isUploading = Object.values(uploads).some(
    (u) => u.status === "uploading"
  );

  return { uploads, upload, uploadMany, clearError, isUploading };
}
