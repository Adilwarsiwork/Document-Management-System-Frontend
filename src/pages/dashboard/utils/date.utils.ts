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
