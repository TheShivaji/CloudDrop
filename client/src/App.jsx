import { useState, useCallback } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import StorageOverview from "./components/ui/StorageOverview";
import UploadZone from "./components/upload/UploadZone";
import FileList from "./components/files/FileList";
import { useFiles } from "./hooks/useFiles";

const TAB_META = {
  dashboard: {
    title:    "Dashboard",
    subtitle: "Storage overview and recent activity",
  },
  files: {
    title:    "My Files",
    subtitle: "All files stored in Amazon S3",
  },
  upload: {
    title:    "Upload Files",
    subtitle: "Drag & drop or browse to upload",
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const {
    files,
    summary,
    loading,
    error,
    deletingKey,
    refresh,
    removeFile,
  } = useFiles();

  // After a successful upload, refresh the file list from S3
  const handleUploadSuccess = useCallback(() => {
    refresh();
  }, [refresh]);

  const { title, subtitle } = TAB_META[activeTab] || TAB_META.dashboard;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={title}
          subtitle={subtitle}
          onRefresh={refresh}
          isRefreshing={loading}
        />

        <div className="flex-1 p-6 lg:p-8 space-y-8 animate-fade-in">

          {/* ── Dashboard tab ─────────────────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <>
              <StorageOverview
                summary={summary}
                files={files}
                loading={loading}
              />

              {/* Quick-upload shortcut */}
              <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Quick Upload
                </h2>
                <UploadZone onUploadSuccess={handleUploadSuccess} />
              </section>

              {/* Recent files preview */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Recent Files
                  </h2>
                  {files.length > 0 && (
                    <button
                      onClick={() => setActiveTab("files")}
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      View all →
                    </button>
                  )}
                </div>
                <FileList
                  files={files.slice(0, 5)}
                  loading={loading}
                  error={error}
                  deletingKey={deletingKey}
                  onDelete={removeFile}
                  onUploadClick={() => setActiveTab("upload")}
                />
              </section>
            </>
          )}

          {/* ── Files tab ─────────────────────────────────────────────────── */}
          {activeTab === "files" && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">All Files</h2>
                  {summary && !loading && (
                    <p className="text-sm text-slate-500 mt-1">
                      {summary.count} file{summary.count !== 1 ? "s" : ""} ·{" "}
                      {summary.totalSizeFormatted} total
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="btn-primary"
                >
                  + Upload
                </button>
              </div>

              <FileList
                files={files}
                loading={loading}
                error={error}
                deletingKey={deletingKey}
                onDelete={removeFile}
                onUploadClick={() => setActiveTab("upload")}
              />
            </section>
          )}

          {/* ── Upload tab ────────────────────────────────────────────────── */}
          {activeTab === "upload" && (
            <section className="max-w-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Upload Files</h2>
              <p className="text-sm text-slate-500 mb-6">
                Files are uploaded directly to your private Amazon S3 bucket.
                Supported formats: images, PDFs, Office documents, archives,
                audio, video, code files. Maximum size: 100 MB per file.
              </p>
              <UploadZone onUploadSuccess={handleUploadSuccess} />
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
