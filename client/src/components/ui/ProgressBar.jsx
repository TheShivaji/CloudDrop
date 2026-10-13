import { CheckCircle, XCircle, X } from "lucide-react";

/**
 * ProgressBar — shows upload progress for a single file.
 *
 * @param {string}   filename
 * @param {number}   progress  - 0-100
 * @param {"uploading"|"done"|"error"} status
 * @param {string}   [error]
 * @param {Function} [onDismiss]
 */
export default function ProgressBar({ filename, progress, status, error, onDismiss }) {
  const isDone  = status === "done";
  const isError = status === "error";

  const barColor = isError
    ? "bg-red-500"
    : isDone
    ? "bg-emerald-500"
    : "bg-brand-500";

  const displayName =
    filename.length > 35 ? filename.slice(0, 35) + "…" : filename;

  return (
    <div className="card p-3 flex flex-col gap-2 animate-slide-up">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isDone && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          {isError && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
          {!isDone && !isError && (
            <span className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin flex-shrink-0" />
          )}
          <span className="text-sm text-white truncate">{displayName}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isError && (
            <span className={`text-xs font-mono ${isDone ? "text-emerald-400" : "text-slate-400"}`}>
              {isDone ? "Done" : `${progress}%`}
            </span>
          )}
          {(isDone || isError) && onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress track */}
      {!isError && (
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {isError && error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
