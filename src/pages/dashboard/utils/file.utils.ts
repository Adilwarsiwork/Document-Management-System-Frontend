import { zipSync } from "fflate";
import {
  File,
  FileArchive,
  FileImage,
  FileText,
  FileType2,
} from "lucide-react";

import { uniqueZipEntryName } from "./zip-name.utils";

const IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "bmp",
  "avif",
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Lower-cased extension without the dot, e.g. "report.PDF" -> "pdf".
export function fileExtensionFromName(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec((name ?? "").trim());

  return match ? match[1].toLowerCase() : "";
}

// A stored url often carries a query string (signed links), so the file name
// is the last path segment before "?" or "#".
export function fileNameFromUrl(url: string): string {
  const trimmed = url?.trim() ?? "";

  if (!trimmed || trimmed.startsWith("data:")) return "";

  const path = trimmed.split(/[?#]/)[0];
  const segment = path.split(/[\\/]/).pop() ?? "";

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function getFileIcon(fileName: string) {
  const extension = fileExtensionFromName(fileName);

  if (IMAGE_EXTENSIONS.includes(extension)) {
    return FileImage;
  }

  if (extension === "pdf") return FileText;

  if (["zip", "rar", "7z"].includes(extension)) {
    return FileArchive;
  }

  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return FileType2;
  }

  return File;
}

// The storage bucket sends no CORS headers, so a browser cannot read a file it
// requests directly. The dev server relays those requests (see the "/storage"
// proxy in vite.config.ts), which makes the file same-origin. A deployed app
// needs the bucket CORS rule in docs/s3-cors.json instead.
const DEV_FILE_PROXY = "/storage";

export function toReadableFileUrl(url: string): string {
  if (!import.meta.env.DEV || !/^https?:\/\//i.test(url ?? "")) return url;

  try {
    const parsed = new URL(url);

    if (!parsed.hostname.endsWith(".amazonaws.com")) return url;

    return `${DEV_FILE_PROXY}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

// The stored links live on another origin, where browsers ignore the anchor
// `download` attribute, so the file is fetched into a blob and saved through a
// temporary object url instead. Rejects when the request cannot be completed.
export async function downloadFile(
  url: string,
  fileName: string,
): Promise<void> {
  const response = await fetch(toReadableFileUrl(url));

  if (!response.ok) {
    throw new Error(`The file request failed with status ${response.status}.`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName || "download";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Released once the browser has had time to start the download.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

export interface ZipCandidate {
  /** Stable identity used to match a failure back to the row it came from. */
  id: string;
  url: string;
  fileName: string;
}

export interface ZipFailure {
  id: string;
  fileName: string;
  reason: string;
}

export interface ZipResult {
  /** Name of the archive that was written, or null when nothing was fetched. */
  archiveName: string | null;
  /** Rows whose bytes could not be read, so they are never silently dropped. */
  failures: ZipFailure[];
}

export interface ZipProgress {
  completed: number;
  total: number;
}

/**
 * Fetches each file and streams it into one archive.
 *
 * Files are added as they arrive rather than all at once, so ten small documents
 * do not wait on the slowest one before the download can start. `onProgress`
 * reports per-file completion so the caller can show live feedback.
 *
 * A file that cannot be read is reported and skipped: the rest of the archive is
 * still worth delivering, and the caller is told exactly what is missing.
 */
export async function downloadFilesAsZip(
  candidates: ZipCandidate[],
  onProgress?: (progress: ZipProgress) => void,
): Promise<ZipResult> {
  if (candidates.length === 0) {
    return { archiveName: null, failures: [] };
  }

  const usedNames = new Map<string, string>();
  const failures: ZipFailure[] = [];

  // `level: 0` stores the bytes uncompressed. The documents here are already
  // compressed formats (PDF, JPEG, XLSX), so deflating them would burn CPU to
  // save nothing measurable. Keyed by entry name, which is how zipSync names
  // files inside the archive.
  const entries: Record<string, Uint8Array> = {};

  // Fetched sequentially on purpose. Reading ten large documents at once means
  // holding ten blobs in memory together, which is what makes tabs fall over.
  for (const [index, candidate] of candidates.entries()) {
    try {
      const response = await fetch(toReadableFileUrl(candidate.url));

      if (!response.ok) {
        throw new Error(`The request failed with status ${response.status}.`);
      }

      const buffer = await response.arrayBuffer();

      entries[uniqueZipEntryName(candidate.fileName, usedNames)] =
        new Uint8Array(buffer);
    } catch (error) {
      failures.push({
        id: candidate.id,
        fileName: candidate.fileName,
        reason:
          error instanceof Error ? error.message : "The file could not be read.",
      });
    }

    onProgress?.({ completed: index + 1, total: candidates.length });
  }

  // Nothing was readable, so there is no archive worth offering.
  const entryCount = Object.keys(entries).length;

  if (entryCount === 0) {
    return { archiveName: null, failures };
  }

  const archiveName = `documents-${entryCount}.zip`;
  const archive = zipSync(entries, { level: 0 });
  const objectUrl = URL.createObjectURL(
    new Blob([archive], { type: "application/zip" }),
  );
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = archiveName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

  return { archiveName, failures };
}
