import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, LogOut } from "lucide-react";

export default function WelcomePage() {
  const navigate = useNavigate();

  function handleLogout() {
    sessionStorage.removeItem("dms_token");
    navigate("/login", { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-lg shadow-slate-200/50 sm:p-12">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <FileText size={30} />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
          <CheckCircle2 size={16} />
          Authentication successful
        </div>

        <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>

        <p className="mt-4 leading-7 text-slate-500">
          You're signed in. Your document management workspace is ready.
        </p>

        <button
          onClick={handleLogout}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </section>
    </main>
  );
}
