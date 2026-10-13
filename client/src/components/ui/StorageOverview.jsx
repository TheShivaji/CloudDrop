/**
 * StorageOverview.jsx
 *
 * Displays real storage statistics sourced from the backend's
 * GET /api/files response (S3 ListObjectsV2).
 *
 * No invented quotas, fake percentages, or hard-coded limits.
 * If the backend hasn't responded yet, skeleton loaders are shown.
 */

import { Files, HardDrive, Clock, TrendingUp } from "lucide-react";
import { formatBytes, formatDate } from "../../utils/formatters";

function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-24 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}

export default function StorageOverview({ summary, files, loading }) {
  const newestFile = files?.[0]; // already sorted newest-first by the API

  const stats = [
    {
      icon:  Files,
      label: "Total Files",
      value: loading ? "—" : String(summary?.count ?? 0),
      sub:   "Stored in S3",
      color: "bg-brand-600/20 text-brand-400",
    },
    {
      icon:  HardDrive,
      label: "Storage Used",
      value: loading ? "—" : formatBytes(summary?.totalSize ?? 0),
      sub:   "Across all objects",
      color: "bg-purple-600/20 text-purple-400",
    },
    {
      icon:  Clock,
      label: "Last Upload",
      value: loading
        ? "—"
        : newestFile
        ? formatDate(newestFile.lastModified)
        : "No files yet",
      sub: newestFile?.name
        ? newestFile.name.length > 22
          ? newestFile.name.slice(0, 22) + "…"
          : newestFile.name
        : undefined,
      color: "bg-emerald-600/20 text-emerald-400",
    },
    {
      icon:  TrendingUp,
      label: "Avg File Size",
      value:
        loading || !summary?.count
          ? "—"
          : formatBytes(Math.round(summary.totalSize / summary.count)),
      sub: summary?.count ? `Over ${summary.count} file${summary.count === 1 ? "" : "s"}` : undefined,
      color: "bg-pink-600/20 text-pink-400",
    },
  ];

  return (
    <section aria-label="Storage overview">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>
    </section>
  );
}
