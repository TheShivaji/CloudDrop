import { AlertTriangle, X, Trash2 } from "lucide-react";

/**
 * DeleteConfirmModal — asks the user to confirm before deleting a file.
 *
 * Props:
 *  filename    — string
 *  onConfirm   — () => void
 *  onCancel    — () => void
 *  isDeleting  — boolean
 */
export default function DeleteConfirmModal({
  filename,
  onConfirm,
  onCancel,
  isDeleting,
}) {
  const displayName =
    filename?.length > 40 ? filename.slice(0, 40) + "…" : filename;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="card max-w-md w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2
                id="delete-modal-title"
                className="text-base font-semibold text-white"
              >
                Delete file?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File name */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-6">
          <p className="text-sm text-white font-mono break-all">{displayName}</p>
        </div>

        <p className="text-sm text-slate-400 mb-6">
          This file will be permanently removed from Amazon S3 and cannot be
          recovered.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            id="delete-cancel-btn"
            onClick={onCancel}
            disabled={isDeleting}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            id="delete-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn-danger"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
