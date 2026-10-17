/**
 * Names the entries inside a generated archive.
 *
 * Split out from file.utils so it carries no Vite or browser dependencies and
 * can be reasoned about on its own: an archive with two files of the same name
 * silently loses one when extracted, so this is the piece most worth being
 * certain about.
 */

/** Lower-cased extension without the dot, e.g. "report.PDF" -> "pdf". */
export function zipEntryExtension(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec((name ?? "").trim());

  return match ? match[1].toLowerCase() : "";
}

/**
 * Keeps every entry inside one flat folder without ever repeating a name.
 *
 * `used` maps a lower-cased name to the name that was actually accepted, and is
 * mutated. Passing the same map across a batch is what makes the names unique
 * relative to each other.
 *
 * Two details matter more than they look:
 *
 * - Comparison is case-insensitive, because a case-insensitive filesystem
 *   (Windows, default macOS) treats "report.pdf" and "REPORT.PDF" as one file.
 * - A duplicate reuses the casing of the entry that claimed the name first.
 *   Rebuilding it from the new name instead would yield "REPORT (3).pdf", which
 *   is a third distinct string that still collides with the first.
 */
export function uniqueZipEntryName(
  fileName: string,
  used: Map<string, string>,
): string {
  const cleaned = (fileName ?? "").trim() || "document";
  const key = cleaned.toLowerCase();
  const existing = used.get(key);

  if (existing === undefined) {
    used.set(key, cleaned);

    return cleaned;
  }

  // Take the extension and stem from whichever spelling was accepted first.
  const extension = zipEntryExtension(existing) || zipEntryExtension(cleaned);
  const stem = extension
    ? existing.slice(0, -(extension.length + 1))
    : existing;
  const suffix = extension ? `.${extension}` : "";

  let counter = 2;
  let candidate = `${stem} (${counter})${suffix}`;

  while (used.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${stem} (${counter})${suffix}`;
  }

  used.set(candidate.toLowerCase(), candidate);

  return candidate;
}