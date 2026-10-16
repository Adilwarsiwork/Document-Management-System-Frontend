import { useEffect } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  X,
} from "lucide-react";

export type ToastVariant = "success" | "error";

export interface ToastMeta {
  label: string;
  value: string;
}

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  /** The reason for a failure, or the confirmation for a success. */
  message: string;
  /** What the user can do about it. */
  hint?: string;
  /** Request context, shown as a labelled list. */
  meta?: ToastMeta[];
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const sectionLabelClass =
  "text-[11px] font-bold uppercase tracking-wider text-slate-400";

export default function Toast({ toast, onClose }: ToastProps) {
  const { id, variant, title, message, hint, meta } = toast;
  const isSuccess = variant === "success";

  // Both variants wait for the user; Escape is always a way out.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(id);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, id]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dims the page so the message cannot be missed, without blocking clicks. */}
      <div className="animate-toast-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" />

      <div
        // Errors interrupt, success updates quietly.
        role={isSuccess ? "status" : "alert"}
        aria-live={isSuccess ? "polite" : "assertive"}
        className="animate-toast-in pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/25 ring-1 ring-slate-900/5 sm:max-w-lg"
      >
        <button
          type="button"
          onClick={() => onClose(id)}
          aria-label="Dismiss notification"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-slate-900/15"
        >
          <X size={17} />
        </button>

        {/* Icon and title stay centered; the body is left aligned for scanning. */}
        <div className="flex flex-col items-center px-7 pt-8 text-center sm:px-8">
          <div
            className={`flex size-14 items-center justify-center rounded-2xl ring-1 ${
              isSuccess
                ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                : "bg-red-500/10 text-red-600 ring-red-500/20"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 size={26} strokeWidth={2} />
            ) : (
              <AlertTriangle size={26} strokeWidth={2} />
            )}
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>

          <p
            className={`mt-2 text-[15px] leading-7 break-words ${
              isSuccess ? "text-slate-600" : "font-medium text-slate-700"
            }`}
          >
            {message}
          </p>
        </div>

        {(hint || !!meta?.length) && (
          <div className="mt-6 space-y-4 px-7 sm:px-8">
            {hint && (
              <section
                className={`rounded-2xl p-4 ring-1 ${
                  isSuccess
                    ? "bg-emerald-50/70 ring-emerald-100"
                    : "bg-indigo-50/70 ring-indigo-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSuccess ? (
                    <ArrowRight
                      size={15}
                      className="text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <Lightbulb
                      size={15}
                      className="text-indigo-600"
                      aria-hidden="true"
                    />
                  )}
                  <h3 className={sectionLabelClass}>
                    {isSuccess ? "Next step" : "Suggested fix"}
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-700">{hint}</p>
              </section>
            )}

            {!!meta?.length && (
              <section>
                <h3 className={sectionLabelClass}>Details</h3>

                <dl className="mt-2 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-900/5">
                  {meta.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <dt className="shrink-0 text-sm text-slate-500">
                        {label}
                      </dt>
                      <dd className="min-w-0 truncate text-right text-sm font-semibold text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        )}

        <div className="px-7 pt-6 pb-7 sm:px-8">
          <button
            type="button"
            onClick={() => onClose(id)}
            autoFocus
            className={`inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition focus-visible:ring-4 ${
              isSuccess
                ? "bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-700 focus-visible:ring-indigo-500/30"
                : "bg-red-600 shadow-red-600/25 hover:bg-red-700 focus-visible:ring-red-500/30"
            }`}
          >
            {isSuccess ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
