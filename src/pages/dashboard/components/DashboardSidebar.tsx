import { useEffect, useState } from "react";
import {
  CloudUpload,
  FileSearch,
  FileText,
  LogOut,
  Menu,
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

// Matches Tailwind's `md` breakpoint, where the sidebar becomes permanent.
const DESKTOP_QUERY = "(min-width: 768px)";

const navItemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition focus-visible:ring-4 focus-visible:ring-indigo-500/25";

export default function DashboardSidebar({
  activeSection,
  onSectionChange,
  onLogout,
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel =
    navigation.find((item) => item.id === activeSection)?.label ?? "";

  const handleSectionChange = (section: DashboardSection) => {
    onSectionChange(section);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    onLogout();
  };

  // While the drawer is open, Escape closes it and the page behind it stops
  // scrolling, so only the drawer moves.
  useEffect(() => {
    if (!mobileOpen) return;

    const root = document.documentElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = root.style.overflow;

    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  // The drawer only exists on mobile: growing the viewport releases the scroll
  // lock and hides the overlay that belongs to it.
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };

    desktop.addEventListener("change", handleChange);

    return () => desktop.removeEventListener("change", handleChange);
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <FileText size={19} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-900">
              DMS
            </p>
            <p className="truncate text-xs leading-tight text-slate-500">
              {activeLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="dashboard-sidebar"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-4 focus-visible:ring-indigo-500/25"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Tapping the dimmed page closes the drawer. */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Reuses one element for both the mobile drawer and fixed desktop rail, while `invisible` hides the closed drawer from keyboard navigation and the accessibility tree without interrupting its slide-out animation. */}
      <aside
        id="dashboard-sidebar"
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white p-5 transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none md:sticky md:bottom-auto md:top-0 md:z-auto md:h-screen md:w-65 md:max-w-none md:shrink-0 md:translate-x-0 md:visible ${
          mobileOpen
            ? "visible translate-x-0 shadow-2xl md:shadow-none"
            : "invisible -translate-x-full"
        }`}
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

        <nav className="space-y-1" aria-label="Document workspace">
          {navigation.map(({ label, id, icon: Icon }) => {
            const isActive = activeSection === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSectionChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`${navItemClass} ${
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
          Account
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className={`${navItemClass} text-slate-600 transition hover:bg-red-50 hover:text-red-600`}
        >
          <LogOut size={19} />
          Logout
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
      </aside>
    </>
  );
}
