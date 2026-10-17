// Date inputs work in ISO format, but the API expects dd-MM-yyyy.
export function toApiDate(isoDate: string): string {
  const trimmedDate = isoDate?.trim() ?? "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate);

  if (!match) return trimmedDate;

  const [, year, month, day] = match;

  return `${day}-${month}-${year}`;
}

export function todayIso(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

// 2024-02-01T00:00:00 -> 01-02-2024
export function formatDisplayDate(value: string): string {
  const trimmed = value?.trim() ?? "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);

  if (!match) return trimmed;

  const [, year, month, day] = match;

  return `${day}-${month}-${year}`;
}

// 2024-02-26T16:14:33 -> "2 years ago". Also accepts an epoch timestamp, so a
// value that arrived as a number (a cache entry's `cachedAt`) needs no
// conversion just to be formatted.
export function formatRelativeTime(value: string | number): string {
  const timestamp =
    typeof value === "number" ? value : Date.parse(value?.trim() ?? "");

  if (!Number.isFinite(timestamp)) return "";

  const seconds = Math.max(0, (Date.now() - timestamp) / 1000);

  const units: [seconds: number, label: string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];

  for (const [size, label] of units) {
    const amount = Math.floor(seconds / size);

    if (amount >= 1) return `${amount} ${label}${amount === 1 ? "" : "s"} ago`;
  }

  return "just now";
}

// 2024-02-26T16:14:33 -> 26-02-2024, 16:14
export function formatDateTime(value: string): string {
  const trimmed = value?.trim() ?? "";
  const time = /T(\d{2}):(\d{2})/.exec(trimmed);

  return time ? `${formatDisplayDate(trimmed)}, ${time[1]}:${time[2]}` : formatDisplayDate(trimmed);
}

// 2024-02-26T16:14:33 -> 26-02-2024, 16:14:33
export function formatDateTimeWithSeconds(value: string): string {
  const trimmed = value?.trim() ?? "";
  const time = /T(\d{2}):(\d{2}):(\d{2})/.exec(trimmed);

  return time
    ? `${formatDisplayDate(trimmed)}, ${time[1]}:${time[2]}:${time[3]}`
    : formatDateTime(trimmed);
}
