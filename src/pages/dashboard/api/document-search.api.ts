import axios from "axios";

import { ApiError, apiClient } from "../../../services/api-client";
import { toApiTimestamp } from "../utils/date.utils";

import type {
  DocumentSearchFilters,
  DocumentSearchPage,
  DocumentSearchRequest,
  DocumentSearchResult,
} from "../types/document-search.types";

// The documented request sends placeholder entries when no tag is picked;
// an empty array comes back with no results.
const EMPTY_TAG_FILTER = [{ tag_name: "" }, { tag_name: "" }];

const PAGE_SIZE = 10;

export { PAGE_SIZE };

const ID_KEYS = ["document_id", "id", "entry_id", "_id"];
const FILE_KEYS = ["file_url", "fileUrl", "url", "link"];
const DATE_KEYS = ["document_date", "documentDate", "date"];
const MAJOR_KEYS = ["major_head", "majorHead", "category"];
const MINOR_KEYS = ["minor_head", "minorHead", "sub_category", "department"];
const REMARK_KEYS = ["document_remarks", "documentRemarks", "remarks"];
const TAG_KEYS = [
  "tags",
  "tag",
  "tag_name",
  "tag_names",
  "tagNames",
  "document_tags",
  "documentTags",
  "document_tag",
  "tag_list",
  "tagList",
  "tags_data",
];
const TAG_NAME_KEYS = [
  "tag_name",
  "tagName",
  "name",
  "label",
  "title",
  "text",
  "value",
];
const UPLOADER_KEYS = ["uploaded_by", "uploadedBy", "user_name", "created_by"];
const UPLOAD_TIME_KEYS = ["upload_time", "uploadTime", "created_at"];
const TOTAL_KEYS = ["recordsFiltered", "recordsTotal", "total", "count"];
// The response repeats the overall match count on every row.
const TOTAL_COUNT_KEYS = ["total_count", "totalCount"];

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") return value;
  }

  return undefined;
}

function readText(record: Record<string, unknown>, keys: string[]): string {
  const value = pick(record, keys);

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  return "";
}

function readCount(
  record: Record<string, unknown>,
  keys: string[],
): number | undefined {
  const value = pick(record, keys);
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

// Trims, drops blanks and removes case-insensitive repeats, so a document that
// repeats a tag never renders it twice.
function uniqueTags(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const name = value.trim();

    if (!name) continue;

    const key = name.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(name);
  }

  return result;
}

function readTagNames(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return uniqueTags(
      raw.map((entry) => {
        if (typeof entry === "string") return entry;

        if (entry && typeof entry === "object") {
          const name = pick(entry as Record<string, unknown>, TAG_NAME_KEYS);

          return typeof name === "string" ? name : "";
        }

        return "";
      }),
    );
  }

  // A tags field sent as one delimited string rather than a list.
  if (typeof raw === "string") return uniqueTags(raw.split(/[\r\n,]+/));

  return [];
}

function readTags(record: Record<string, unknown>): string[] {
  for (const key of TAG_KEYS) {
    const raw = record[key];

    if (raw === undefined || raw === null || raw === "") continue;

    const tags = readTagNames(raw);

    if (tags.length > 0) return tags;
  }

  return [];
}

// A segment only counts as a tag if it is short and reads like a label rather
// than a sentence. Two words is the ceiling because real tags such as
// "Work Order" need it.
const TAG_LIKE_MAX_LENGTH = 40;
const TAG_LIKE_MAX_WORDS = 2;

function looksLikeTag(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (trimmed.length > TAG_LIKE_MAX_LENGTH) return false;
  if (/[.!?;]$/.test(trimmed)) return false;

  return trimmed.split(/\s+/).length <= TAG_LIKE_MAX_WORDS;
}

/**
 * Recovers a tag list that the endpoint folded into the remarks field.
 *
 * The endpoint has been seen both to return tags in their own array and to
 * flatten them into document_remarks as a delimited list, so both are handled:
 *
 * - Newlines are an unambiguous separator and are always trusted.
 * - Commas and semicolons are only trusted when every resulting segment looks
 *   like a tag, so a written remark containing a comma ("Signed by the board, on
 *   the 4th") stays one remark instead of becoming two invented tags.
 *
 * The remaining risk is a remark that is genuinely two short phrases joined by a
 * comma, which will still read as two tags. Tighten TAG_LIKE_MAX_WORDS to 1 if
 * that turns up in real data.
 */
function splitRemarksIntoTags(remarks: string): string[] {
  if (!remarks) return [];

  if (remarks.includes("\n")) return uniqueTags(remarks.split(/\r?\n/));

  const segments = remarks
    .split(/[,;]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  // A single segment is just the remark itself, not a one-item tag list.
  if (segments.length < 2) return [];

  return segments.every(looksLikeTag) ? uniqueTags(segments) : [];
}

function normalizeDocument(
  entry: unknown,
  index: number,
): DocumentSearchResult {
  const record = (entry ?? {}) as Record<string, unknown>;

  const remarks = readText(record, REMARK_KEYS);
  const explicitTags = readTags(record);

  // Tags recovered from the remarks are rendered as chips, so the same text is
  // not shown twice.
  const recoveredTags =
    explicitTags.length === 0 ? splitRemarksIntoTags(remarks) : [];

  return {
    id: readText(record, ID_KEYS) || `document-${index}`,
    fileUrl: readText(record, FILE_KEYS),
    documentDate: readText(record, DATE_KEYS),
    majorHead: readText(record, MAJOR_KEYS),
    minorHead: readText(record, MINOR_KEYS),
    remarks: recoveredTags.length > 0 ? "" : remarks,
    tags: explicitTags.length > 0 ? explicitTags : recoveredTags,
    uploadedBy: readText(record, UPLOADER_KEYS),
    uploadedAt: readText(record, UPLOAD_TIME_KEYS),
    totalCount: readCount(record, TOTAL_COUNT_KEYS),
  };
}

function findList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const container = payload as Record<string, unknown>;

  for (const key of ["data", "documents", "results", "rows", "entries"]) {
    const value = container[key];

    if (Array.isArray(value)) return value;

    // Some deployments nest the list one level deeper, under data.data.
    if (value && typeof value === "object") {
      const nested = findList(value);

      if (nested.length > 0) return nested;
    }
  }

  return [];
}

export function buildSearchRequest(
  filters: DocumentSearchFilters,
  start: number,
): DocumentSearchRequest {
  return {
    major_head: filters.majorHead,
    minor_head: filters.minorHead,
    from_date: toApiTimestamp(filters.fromDate),
    to_date: toApiTimestamp(filters.toDate),
    tags:
      filters.tags.length > 0
        ? filters.tags.map((tag) => ({ tag_name: tag }))
        : EMPTY_TAG_FILTER,
    uploaded_by: "",
    start,
    length: PAGE_SIZE,
    filterId: "",
    search: { value: filters.keyword.trim() },
  };
}

export function normalizeResponse(payload: unknown): DocumentSearchPage {
  const entries = findList(payload);
  const container =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  // Totals sit beside the list, or inside it when the list is wrapped.
  const nested =
    container.data && typeof container.data === "object" && !Array.isArray(container.data)
      ? (container.data as Record<string, unknown>)
      : {};

  const documents = entries.map(normalizeDocument);

  const reportedTotal = pick(nested, TOTAL_KEYS) ?? pick(container, TOTAL_KEYS);
  const parsedTotal = Number(reportedTotal);

  // When the envelope carries no total, the response still repeats the overall
  // match count on every row (total_count), which is what the live API sends.
  const total = Number.isFinite(parsedTotal)
    ? parsedTotal
    : (documents[0]?.totalCount ?? documents.length);

  return { documents, total };
}

export async function searchDocuments(
  filters: DocumentSearchFilters,
  start = 0,
): Promise<DocumentSearchPage> {
  let payload: unknown;

  try {
    const response = await apiClient.post<Record<string, unknown>>(
      "/searchDocumentEntry",
      buildSearchRequest(filters, start),
    );

    payload = response.data;
  } catch (error) {
    // A missing or expired token is the one failure the user can act on.
    if (
      (error instanceof ApiError && error.status === 401) ||
      (axios.isAxiosError(error) && error.response?.status === 401)
    ) {
      throw new Error(
        "Your session has expired. Log in again to search documents.",
        { cause: error },
      );
    }

    throw error;
  }

  const envelope = payload as { status?: boolean; message?: string } | undefined;

  // The API answers with HTTP 200 even when it rejects the request.
  if (envelope?.status === false) {
    throw new Error(envelope.message || "The search request was rejected.");
  }

  const page = normalizeResponse(payload);

  // The endpoint can return every match in one response instead of the
  // requested page, so the window is applied here whenever more rows arrive
  // than a page holds. A deployment that does page the results already returns
  // just the window, which then passes through untouched.
  const documents =
    page.documents.length > PAGE_SIZE
      ? page.documents.slice(start, start + PAGE_SIZE)
      : page.documents;

  return { documents, total: page.total };
}
