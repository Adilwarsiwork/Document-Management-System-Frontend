import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type InlineAlertVariant = "error" | "success" | "warning" | "info";

interface InlineAlertVariantConfig {
  icon: typeof AlertTriangle;
  containerClass: string;
  iconClass: string;
}

const VARIANT_CONFIG: Record<InlineAlertVariant, InlineAlertVariantConfig> = {
  error: {
    icon: AlertTriangle,
    containerClass: "border-red-200 bg-red-50 text-red-800",
    iconClass: "text-red-500",
  },
  success: {
    icon: CheckCircle2,
    containerClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconClass: "text-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "border-amber-200 bg-amber-50 text-amber-800",
    iconClass: "text-amber-500",
  },
  info: {
    icon: Info,
    containerClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
    iconClass: "text-indigo-500",
  },
};

interface InlineAlertProps {
  variant?: InlineAlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A compact, non-blocking notice for forms and pages.
 *
 * Failures interrupt the reader and are announced assertively; confirmations
 * update politely, so a screen reader treats them differently.
 */
export default function InlineAlert({
  variant = "error",
  title,
  children,
  className = "",
}: InlineAlertProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const isUrgent = variant === "error" || variant === "warning";

  return (
    <div
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${config.containerClass} ${className}`}
    >
      <Icon
        size={18}
        strokeWidth={2}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${config.iconClass}`}
      />

      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}
