import { Clock3 } from "lucide-react";

/**
 * The header clock: a tag naming what the numbers count down to, and the
 * remaining minutes and seconds as one digit per box.
 *
 * A single countdown is owned by the dashboard page and rendered twice, once per
 * header, so the two never disagree and only one timer is running.
 */

// The session runs for an hour, so the clock spends most of its life green and
// only warns as the deadline closes: amber across the quarter of an hour before
// it, then red for the final five. Starting red or amber would leave the timer
// shouting for most of the session and meaning nothing by the time it matters.
//
// The steady tone is a true green rather than the emerald used by the
// "workspace active" badge beside it. The two sit close enough in hue that a
// pair of greens in one header reads as a single colour.
const STEADY_THRESHOLD_SECONDS = 40 * 60;
const URGENT_THRESHOLD_SECONDS = 25 * 60;

type Tone = "steady" | "soon" | "urgent";

interface ToneStyle {
  tag: string;
  icon: string;
  digit: string;
  separator: string;
  unit: string;
}

const TONES: Record<Tone, ToneStyle> = {
  steady: {
    tag: "bg-green-100 text-green-700",
    icon: "text-green-600",
    digit: "border-green-200 bg-white text-green-700",
    separator: "text-green-300",
    unit: "text-green-500",
  },
  soon: {
    tag: "bg-amber-100 text-amber-700",
    icon: "text-amber-600",
    digit: "border-amber-200 bg-white text-amber-700",
    separator: "text-amber-300",
    unit: "text-amber-500",
  },
  urgent: {
    tag: "bg-red-100 text-red-700",
    icon: "text-red-600",
    digit: "border-red-200 bg-white text-red-700",
    separator: "text-red-300",
    unit: "text-red-500",
  },
};

interface SessionCountdownProps {
  /** Seconds left in the session, or null when no deadline was recorded. */
  seconds: number | null;
  /**
   * The mobile header shares its row with the logo and the menu button, so it
   * takes the digits alone. The tag stays in the accessible name either way.
   */
  compact?: boolean;
}

export default function SessionCountdown({
  seconds,
  compact = false,
}: SessionCountdownProps) {
  // A session with no deadline has nothing to count down, and a negative value
  // cannot reach this component: the clock is derived from a stored deadline.
  if (seconds === null) return null;

  const minutes = Math.floor(seconds / 60);
  const secondsPart = seconds % 60;
  const tone = readTone(seconds);
  const style = TONES[tone];

  return (
    // The timer carries a spoken sentence instead of its boxes: four digits
    // read as "five nine two four" is far worse than the sentence it replaces.
    // `role="timer"` does not announce on change, so a clock that rewrites
    // itself every second stays silent unless the reader goes looking for it.
    <div
      role="timer"
      aria-label={`Session expires in ${minutes} ${pluralise(minutes, "minute")} and ${secondsPart} ${pluralise(secondsPart, "second")}`}
      className={`border-slate-200 bg-slate-50/70 ${
        compact
          ? "flex items-center gap-1 rounded-xl border px-2 py-1.5"
          : "flex flex-col items-start rounded-2xl border px-3 py-1.5"
      }`}
    >
      {compact ? (
        <Clock3 size={14} aria-hidden className={style.icon} />
      ) : (
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.14em] transition-colors duration-300 ${
            style.tag
          }`}
        >
          <Clock3 size={12} aria-hidden />
          Session expires in
        </span>
      )}

      <div
        aria-hidden
        className={`flex items-center mx-auto ${compact ? "gap-0.5" : "mt-1 gap-1.5"}`}
      >
        <TimeGroup value={minutes} unit="min" tone={tone} compact={compact} />

        <span className={`text-sm font-bold leading-none ${style.separator}`}>
          :
        </span>

        <TimeGroup
          value={secondsPart}
          unit="sec"
          tone={tone}
          compact={compact}
        />
      </div>
    </div>
  );
}

function readTone(seconds: number): Tone {
  if (seconds <= URGENT_THRESHOLD_SECONDS) return "urgent";
  if (seconds <= STEADY_THRESHOLD_SECONDS) return "soon";

  return "steady";
}

function pluralise(value: number, unit: string): string {
  return value === 1 ? unit : `${unit}s`;
}

// One unit of the countdown. Minutes never exceed 60 and seconds never exceed
// 59, so every group is exactly two boxes and the row cannot change width as
// the numbers tick over.
function TimeGroup({
  value,
  unit,
  tone,
  compact,
}: {
  value: number;
  unit: string;
  tone: Tone;
  compact: boolean;
}) {
  const digits = String(value).padStart(2, "0").split("");

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        {digits.map((digit, index) => (
          <span
            key={`${unit}-${index}`}
            className={`flex items-center justify-center rounded-lg border font-bold tabular-nums transition-colors duration-300 ${
              compact ? "size-5 text-xs" : "size-7 text-[15px]"
            } ${TONES[tone].digit}`}
          >
            {digit}
          </span>
        ))}
      </div>
    </div>
  );
}
