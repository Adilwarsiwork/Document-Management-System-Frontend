import { useState } from "react";
import {
  CloudUpload,
  FileSearch,
  FileText,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

export type DashboardSection = "upload" | "search";

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onLogout: () => void;
}

const navigation = [
  { label: "Upload documents", id: "upload", icon: CloudUpload },
  { label: "Search documents", id: "search", icon: FileSearch },
] as const;

export default function DashboardSidebar({
  activeSection,
  onSectionChange,
  onLogout,
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSectionChange = (section: DashboardSection) => {
    onSectionChange(section);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <FileText size={22} />
          </div>
          <span className="font-bold text-slate-900">DMS</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          className="rounded-lg border border-slate-200 p-2 text-slate-600"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/20 md:hidden"
        />
      )}

      <aside
        className={`${
          mobileOpen ? "fixed left-0 top-16 z-30 flex" : "hidden"
        } bottom-0 w-65 flex-col border-r border-slate-200 bg-white p-5 md:sticky md:top-0 md:flex md:h-screen md:shrink-0`}
      >
        <div className="mb-10 hidden items-center gap-3 md:flex">
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <FileText size={23} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">DMS</p>
            <p className="text-xs text-slate-500">Document management</p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map(({ label, id, icon: Icon }) => {
            const isActive = activeSection === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSectionChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={19} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="my-7 border-t border-slate-100" />

        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Preferences
        </p>

        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Settings size={19} />
          Settings
        </button>

        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <ShieldCheck size={21} className="mb-3 text-indigo-600" />
          <p className="text-sm font-semibold text-slate-800">
            Secure workspace
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Access your document workspace securely.
          </p>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
