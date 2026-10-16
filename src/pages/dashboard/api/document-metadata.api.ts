import { apiClient } from "../../../services/api-client";
import type { DocumentTag } from "../types/document-metadata.types";

interface ApiResponse<T> {
  status?: boolean;
  message?: string;
  data?: T;
}

type TagRecord = Record<string, unknown>;

type TagOption = string | TagRecord;

// The API has used more than one label field for tags, so accept all of them.
const NAME_KEYS = [
  "name",
  "tag_name",
  "tagName",
  "label",
  "title",
  "text",
  "value",
  "tag",
] as const;

const ID_KEYS = ["id", "tag_id", "tagId", "_id"] as const;

// Returns the first value that is present for the given keys.
function pickValue(
  source: TagRecord,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

// Unwraps the tag list from the envelope the endpoint may return.
function extractTagList(payload: unknown): TagOption[] {
  if (Array.isArray(payload)) return payload as TagOption[];

  if (!payload || typeof payload !== "object") return [];

  const container = payload as TagRecord;

  for (const key of ["data", "tags", "documentTags", "document_tags", "results"]) {
    const value = container[key];

    if (Array.isArray(value)) return value as TagOption[];

    // Some deployments wrap the list one level deeper.
    if (value && typeof value === "object") {
      const nested = extractTagList(value);

      if (nested.length > 0) return nested;
    }
  }

  return [];
}

// Converts a raw tag entry into a DocumentTag, or null when unusable.
function normalizeTag(tag: TagOption): DocumentTag | null {
  if (typeof tag === "string") {
    const name = tag.trim();

    return name ? { name } : null;
  }

  if (!tag || typeof tag !== "object") return null;

  const rawName = pickValue(tag, NAME_KEYS);

  if (typeof rawName !== "string" || !rawName.trim()) return null;

  const rawId = pickValue(tag, ID_KEYS);

  return {
    id:
      typeof rawId === "string" || typeof rawId === "number" ? rawId : undefined,
    name: rawName.trim(),
  };
}

export async function fetchDocumentTags(): Promise<DocumentTag[]> {
  const { data } = await apiClient.post<ApiResponse<TagOption[]>>(
    "/documentTags",
    {
      term: "",
    },
  );

  const tags = extractTagList(data).map(normalizeTag);

  return tags.filter((tag): tag is DocumentTag => tag !== null);
}
