import {
  Cloud,
  LayoutDashboard,
  Files,
  Upload,
  Settings,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Files,           label: "My Files",  id: "files"     },
  { icon: Upload,          label: "Upload",     id: "upload"    },
];

const BOTTOM_ITEMS = [
  { icon: Settings,   label: "Settings" },
  { icon: HelpCircle, label: "Help"     },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ icon: Icon, label, id }) => {
    const active = id && activeTab === id;
    return (
      <button
        onClick={() => {
          if (id) onTabChange(id);
          setMobileOpen(false);
        }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-150 text-left
          ${active
            ? "bg-brand-600/30 text-brand-300 border border-brand-500/30"
            : "text-slate-400 hover:text-white hover:bg-white/5"
          }
        `}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${active ? "text-brand-400" : ""}`}
          strokeWidth={active ? 2 : 1.5}
        />
        <span>{label}</span>
        {active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-4 gap-2">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center glow-brand">
          <Cloud className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <div>
          <span className="font-bold text-white tracking-tight">CloudDrop</span>
          <p className="text-xs text-slate-500 leading-none">File Storage</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest px-3 mb-1">
          Menu
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.id} {...item} />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom links */}
      <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.label} icon={item.icon} label={item.label} />
        ))}
      </div>

      {/* S3 status pill */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5 mt-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
        <span className="text-xs text-slate-400">S3 Connected</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-surface-50 border-r border-white/5 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger button */}
      <button
        id="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-50 border border-white/10 text-slate-300"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-64 bg-surface-50 border-r border-white/5 animate-slide-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
