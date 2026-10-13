import { CloudOff, Upload, AlertCircle } from "lucide-react";

const STATES = {
  empty: {
    icon:     CloudOff,
    title:    "No files yet",
    message:  "Upload your first file to get started. Files are stored securely in Amazon S3.",
    color:    "text-slate-500",
    iconBg:   "bg-slate-800",
  },
  error: {
    icon:     AlertCircle,
    title:    "Failed to load files",
    message:  null, // message passed as prop
    color:    "text-red-400",
    iconBg:   "bg-red-900/30",
  },
};

export default function EmptyState({ type = "empty", message, onUploadClick }) {
  const state = STATES[type] || STATES.empty;
  const Icon  = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className={`w-16 h-16 rounded-2xl ${state.iconBg} flex items-center justify-center mb-5`}>
        <Icon className={`w-8 h-8 ${state.color}`} strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{state.title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        {message || state.message}
      </p>

      {type === "empty" && onUploadClick && (
        <button
          id="empty-state-upload-btn"
          onClick={onUploadClick}
          className="btn-primary"
        >
          <Upload className="w-4 h-4" />
          Upload a file
        </button>
      )}

      {type === "error" && (
        <p className="text-xs text-slate-600 mt-2">
          Check that the backend is running and S3 is configured correctly.
        </p>
      )}
    </div>
  );
}
