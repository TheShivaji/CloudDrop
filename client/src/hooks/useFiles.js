/**
 * useFiles.js — Hook for fetching and deleting files.
 *
 * Returns real data from the backend only.
 * summary.totalSize and summary.count reflect actual S3 objects —
 * no invented quotas or fake percentages are added.
 */

import { useState, useCallback, useEffect } from "react";
import { fetchFiles, deleteFile } from "../api/filesApi";

export function useFiles() {
  const [files, setFiles]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFiles();
      setFiles(data.files ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      setError(err.message);
      setFiles([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const removeFile = useCallback(
    async (token) => {
      setDeletingKey(token);
      try {
        await deleteFile(token);
        // Optimistic update — remove from local list immediately
        setFiles((prev) => prev.filter((f) => f.key !== token));
        setSummary((prev) => {
          if (!prev) return prev;
          const deleted = files.find((f) => f.key === token);
          return {
            ...prev,
            count: prev.count - 1,
            totalSize: prev.totalSize - (deleted?.size ?? 0),
          };
        });
      } catch (err) {
        throw err; // let the caller surface the error
      } finally {
        setDeletingKey(null);
      }
    },
    [files]
  );

  return {
    files,
    summary,
    loading,
    error,
    deletingKey,
    refresh: loadFiles,
    removeFile,
  };
}
