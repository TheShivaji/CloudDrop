import { RefreshCw, Cloud } from "lucide-react";

export default function TopBar({ title, subtitle, onRefresh, isRefreshing }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface-50/50 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Powered-by badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-500">
          <Cloud className="w-3 h-3 text-brand-400" />
          <span>Amazon S3</span>
        </div>

        {/* Refresh button */}
        <button
          id="refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-ghost"
          title="Refresh file list"
          aria-label="Refresh file list"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
}
