/**
 * formatters.js — Pure utility functions for display formatting.
 * No JSX here — pure JS only so this file works with .js extension in Vite.
 * Use getFileIconComponent() in JSX files to render the Lucide icon.
 */

import {
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Code,
  File,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";

// ── Bytes → human-readable ────────────────────────────────────────────────────
export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (typeof bytes !== "number" || isNaN(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value : value.toFixed(2)} ${units[i]}`;
}

// ── ISO date string → friendly display ───────────────────────────────────────
export function formatDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date)) return "—";

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── File extension → MIME category ───────────────────────────────────────────
const EXT_MAP = {
  // Images
  jpg: "image", jpeg: "image", png: "image", gif: "image",
  webp: "image", svg: "image", bmp: "image", tiff: "image",
  // Documents
  pdf: "pdf", txt: "text", md: "text", csv: "spreadsheet",
  // Office
  doc: "doc", docx: "doc",
  xls: "spreadsheet", xlsx: "spreadsheet",
  ppt: "presentation", pptx: "presentation",
  // Archives
  zip: "archive", tar: "archive", gz: "archive",
  "7z": "archive", rar: "archive",
  // Audio
  mp3: "audio", wav: "audio", ogg: "audio",
  // Video
  mp4: "video", webm: "video",
  // Code
  js: "code", jsx: "code", ts: "code", tsx: "code",
  py: "code", java: "code", c: "code", cpp: "code",
  html: "code", css: "code", json: "code", xml: "code",
};

export function getFileCategory(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  return EXT_MAP[ext] || "other";
}

/**
 * Returns the Lucide icon *component* (not a JSX element) and className.
 * Callers render it in JSX: const { Icon, className } = getFileIconComponent(name);
 *                             return <Icon className={className} strokeWidth={1.5} />;
 */
export function getFileIconComponent(filename, className = "w-5 h-5") {
  const category = getFileCategory(filename);
  const map = {
    image:        Image,
    video:        Film,
    audio:        Music,
    archive:      Archive,
    code:         Code,
    spreadsheet:  FileSpreadsheet,
    presentation: Presentation,
    doc:          FileText,
    pdf:          FileText,
    text:         FileText,
  };
  return { Icon: map[category] || File, className };
}

// ── Category → accent colour ──────────────────────────────────────────────────
export function getFileColor(filename) {
  const category = getFileCategory(filename);
  switch (category) {
    case "image":        return "text-emerald-400";
    case "video":        return "text-pink-400";
    case "audio":        return "text-yellow-400";
    case "archive":      return "text-orange-400";
    case "code":         return "text-cyan-400";
    case "spreadsheet":  return "text-green-400";
    case "presentation": return "text-red-400";
    case "pdf":          return "text-red-400";
    case "doc":
    case "text":         return "text-blue-400";
    default:             return "text-slate-400";
  }
}
