import { useState } from "react";
import FileCard from "./FileCard";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EmptyState from "../ui/EmptyState";

/**
 * FileList — renders all FileCards and manages the delete confirmation flow.
 *
 * Props:
 *  files         — array of file objects
 *  loading       — boolean (initial load)
 *  error         — string | null
 *  deletingKey   — key currently being deleted (from useFiles)
 *  onDelete      — (key) => Promise<void>
 *  onUploadClick — () => void  (for empty-state CTA)
 */
export default function FileList({
  files,
  loading,
  error,
  deletingKey,
  onDelete,
  onUploadClick,
}) {
  const [pendingDelete, setPendingDelete] = useState(null); // { key, name }
  const [deleteError, setDeleteError]     = useState(null);

  const requestDelete = (key) => {
    const file = files.find((f) => f.key === key);
    if (file) setPendingDelete({ key, name: file.name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      await onDelete(pendingDelete.key);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  // ── Loading skeletons ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="card px-4 py-3.5 flex items-center gap-4 animate-pulse"
          >
            <div className="w-9 h-9 rounded-lg bg-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-48 bg-white/5 rounded" />
              <div className="h-3 w-32 bg-white/5 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return <EmptyState type="error" message={error} />;
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (files.length === 0) {
    return <EmptyState type="empty" onUploadClick={onUploadClick} />;
  }

  // ── File list ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-2">
        {files.map((file) => (
          <FileCard
            key={file.key}
            file={file}
            onDelete={requestDelete}
            isDeleting={deletingKey === file.key}
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <DeleteConfirmModal
          filename={pendingDelete.name}
          onConfirm={confirmDelete}
          onCancel={() => {
            setPendingDelete(null);
            setDeleteError(null);
          }}
          isDeleting={deletingKey === pendingDelete.key}
        />
      )}

      {/* In-modal error (rare: shown if delete API fails after modal opens) */}
      {deleteError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-xl bg-red-900/90 border border-red-500/40 text-sm text-red-200 shadow-xl animate-slide-up">
          <strong className="block mb-1">Delete failed</strong>
          {deleteError}
        </div>
      )}
    </>
  );
}
