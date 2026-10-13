import { Download, Trash2, Loader2 } from "lucide-react";
import { getFileIconComponent, getFileColor, formatBytes, formatDate } from "../../utils/formatters";
import { downloadFile } from "../../api/filesApi";

/**
 * FileCard — displays a single file row with download and delete actions.
 *
 * Props:
 *  file        — { key, name, size, sizeFormatted, lastModified }
 *  onDelete    — (key) => void
 *  isDeleting  — boolean
 */
export default function FileCard({ file, onDelete, isDeleting }) {
  const { Icon, className: iconClass } = getFileIconComponent(file.name, "w-5 h-5");
  const color = getFileColor(file.name);

  const handleDownload = () => downloadFile(file.key);
  const handleDelete   = () => onDelete(file.key);

  return (
    <div
      className={`
        card flex items-center gap-4 px-4 py-3.5
        hover:bg-white/5 transition-all duration-150 group
        ${isDeleting ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className={iconClass} strokeWidth={1.5} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-white truncate"
          title={file.name}
        >
          {file.name}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatBytes(file.size)} · {formatDate(file.lastModified)}
        </p>
      </div>

      {/* Actions — visible on hover / focus on mobile */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 sm:opacity-100">
        <button
          id={`download-btn-${file.key}`}
          onClick={handleDownload}
          className="btn-ghost py-1.5 px-2.5 text-slate-400 hover:text-emerald-400"
          title="Download"
          aria-label={`Download ${file.name}`}
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          id={`delete-btn-${file.key}`}
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn-ghost py-1.5 px-2.5 text-slate-400 hover:text-red-400"
          title="Delete"
          aria-label={`Delete ${file.name}`}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
