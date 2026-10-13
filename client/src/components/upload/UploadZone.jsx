import { useRef, useState, useCallback, useId } from "react";
import { Upload, CloudUpload, Info } from "lucide-react";
import { useUpload } from "../../hooks/useUpload";
import ProgressBar from "../ui/ProgressBar";

// 100 MB in bytes — must match server-side limit
const MAX_SIZE = 100 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/*", "video/*", "audio/*",
  "application/pdf",
  "text/plain", "text/csv", "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/json",
  "application/xml",
  ".md", ".csv",
];

export default function UploadZone({ onUploadSuccess }) {
  const inputId    = useId();
  const inputRef   = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState(null);

  const { uploads, uploadMany, clearError, isUploading } = useUpload({
    onSuccess: onUploadSuccess,
  });

  const handleFiles = useCallback(
    (fileList) => {
      setSizeError(null);
      const files = Array.from(fileList);

      const oversized = files.filter((f) => f.size > MAX_SIZE);
      if (oversized.length > 0) {
        setSizeError(
          `${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the 100 MB limit.`
        );
        return;
      }

      if (files.length === 0) return;
      uploadMany(files);
    },
    [uploadMany]
  );

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    // Only clear if leaving the zone itself (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file
  };

  const uploadEntries = Object.entries(uploads);

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        id="upload-dropzone"
        role="button"
        tabIndex={0}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center
          cursor-pointer transition-all duration-200 select-none outline-none
          focus-visible:ring-2 focus-visible:ring-brand-500
          ${dragOver
            ? "drag-active border-brand-400"
            : "border-white/10 hover:border-brand-500/60 hover:bg-brand-900/10"
          }
        `}
        aria-label="Upload files by clicking or dragging"
      >
        {/* Animated cloud icon */}
        <div
          className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200
            ${dragOver ? "bg-brand-600/30 scale-110" : "bg-white/5"}`}
        >
          {dragOver ? (
            <CloudUpload className="w-8 h-8 text-brand-400 animate-bounce" />
          ) : (
            <Upload className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
          )}
        </div>

        <p className="text-white font-semibold mb-1">
          {dragOver ? "Release to upload" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-slate-500 mb-4">
          or <span className="text-brand-400 underline underline-offset-2">click to browse</span>
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
          <Info className="w-3.5 h-3.5" />
          <span>Max 100 MB per file · Images, PDFs, Office, Archives, Video, Audio, Code</span>
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={onInputChange}
          aria-label="File upload input"
        />
      </div>

      {/* Size error banner */}
      {sizeError && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-900/20 border border-red-500/30 animate-slide-up">
          <Info className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">File too large</p>
            <p className="text-xs text-red-400 mt-0.5">{sizeError}</p>
          </div>
          <button
            onClick={() => setSizeError(null)}
            className="ml-auto text-red-500 hover:text-red-300"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload progress list */}
      {uploadEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isUploading ? "Uploading…" : "Uploads"}
          </p>
          {uploadEntries.map(([name, info]) => (
            <ProgressBar
              key={name}
              filename={name}
              progress={info.progress ?? 0}
              status={info.status}
              error={info.error}
              onDismiss={() => clearError(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
