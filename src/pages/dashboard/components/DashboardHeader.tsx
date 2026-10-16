import { Bell, ChevronDown } from "lucide-react";
import { getAuthRoles, getAuthUserName } from "../../../services/auth-session";

export default function DashboardHeader() {
  const userName = getAuthUserName();
  const roleName = getAuthRoles()[0]?.role ?? "";
  const displayName = userName || "My workspace";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 md:flex">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          Document workspace
        </p>
        <p className="mt-0.5 hidden text-xs text-slate-500 lg:block">
          Manage and find your documents in one place.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 xl:flex">
          <span className="size-2 rounded-full bg-emerald-500" />
          Workspace active
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {initial}
          </div>
          <div className="hidden sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>
            <p className="text-xs text-slate-500">
              {roleName || "Authenticated user"}
            </p>
          </div>
          <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
        </div>
      </div>
    </header>
  );
}
