import axios from "axios";

import { apiClient } from "../../../services/api-client";
import { getAuthUserId } from "../../../services/auth-session";
import { toApiDate } from "../utils/date.utils";
import type { SelectedDocument } from "../types/document.types";
import type { DocumentUploadMetadata } from "../types/document-metadata.types";
interface UploadResponse {
  status?: boolean;
  message?: string;
}

// The API expects the metadata as a JSON string using snake_case keys.
interface UploadMetadataPayload {
  major_head: string;
  minor_head: string;
  document_date: string;
  document_remarks: string;
  tags: { tag_name: string }[];
  user_id: number | string;
}


const buildMetadataPayload = (
  metadata: DocumentUploadMetadata,
): UploadMetadataPayload => {
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return {
    major_head: metadata.major_head,
    minor_head: metadata.minor_head,
    document_date: toApiDate(metadata.documentDate),
    document_remarks: metadata.remarks?.trim() ?? "",
    tags: tags.map((tag) => ({ tag_name: tag })),
    user_id: getAuthUserId(),
  };
};

// Large files need more headroom than the default request timeout.
const UPLOAD_TIMEOUT_MS = 120000;

// Turns a server rejection into a next step the user can actually take.
const FAILURE_HINTS: { pattern: RegExp; hint: string }[] = [
  {
    pattern: /date/i,
    hint: "Pick the date from the calendar. Dates are sent as dd-MM-yyyy.",
  },
  {
    pattern: /file|format|extension|size|upload/i,
    hint: "Upload a PDF or image file that is not empty and is within the size limit.",
  },
  {
    pattern: /tag/i,
    hint: "Choose an existing tag or type a new tag name before submitting.",
  },
  {
    pattern: /token|un-?author|forbidden|session|expired/i,
    hint: "Your session has expired. Sign in again and retry the upload.",
  },
  {
    pattern: /user|permission|role|access/i,
    hint: "Your account may not have upload rights. Contact an administrator.",
  },
];

const hintFor = (reason: string): string | undefined =>
  FAILURE_HINTS.find(({ pattern }) => pattern.test(reason))?.hint;

// Carries the reason, the suggested fix and the request context to the UI.
export class UploadError extends Error {
  readonly reason: string;
  readonly hint?: string;
  readonly fileName?: string;
  readonly status?: number;
  readonly uploaded?: number;
  readonly total?: number;

  constructor(
    reason: string,
    options: {
      hint?: string;
      fileName?: string;
      status?: number;
      uploaded?: number;
      total?: number;
      cause?: unknown;
    } = {},
  ) {
    super(reason, { cause: options.cause });

    this.name = "UploadError";
    this.reason = reason;
    this.hint = options.hint ?? hintFor(reason);
    this.fileName = options.fileName;
    this.status = options.status;
    this.uploaded = options.uploaded;
    this.total = options.total;
  }
}

const toUploadError = (error: unknown, file: File): UploadError => {
  if (error instanceof UploadError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = (error.response?.data as UploadResponse | undefined)
      ?.message;

    if (error.code === "ECONNABORTED") {
      return new UploadError("The upload timed out before it finished.", {
        hint: "Large files can take a while to transfer. Check your connection and try again.",
        fileName: file.name,
      });
    }

    if (!error.response) {
      return new UploadError("Could not reach the server.", {
        hint: "Check your internet connection and try again.",
        fileName: file.name,
      });
    }

    return new UploadError(
      serverMessage || `The server returned an error (HTTP ${status}).`,
      { fileName: file.name, status },
    );
  }

  return new UploadError(
    error instanceof Error ? error.message : "The upload failed.",
    { fileName: file.name },
  );
};

// Uploads a single file; the API accepts one file per request.
const uploadSingleFile = async (file: File, data: string): Promise<void> => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("data", data);

  let response;

  try {
    response = await apiClient.post<UploadResponse>(
      "/saveDocumentEntry",
      formData,
      { timeout: UPLOAD_TIMEOUT_MS },
    );
  } catch (error) {
    throw toUploadError(error, file);
  }

  // The API answers with HTTP 200 even when it rejects the upload.
  if (response.data?.status === false) {
    throw new UploadError(
      response.data.message || "The server rejected the file.",
      { fileName: file.name, status: response.status },
    );
  }
};

export async function uploadDocuments(
  files: SelectedDocument[],
  metadata: DocumentUploadMetadata,
): Promise<void> {
  const data = JSON.stringify(buildMetadataPayload(metadata));

  for (const [index, { file }] of files.entries()) {
    try {
      await uploadSingleFile(file, data);
    } catch (error) {
      const failure = toUploadError(error, file);

      // Reports how far the batch got so the user knows what is already stored.
      if (index === 0) throw failure;

      throw new UploadError(
        `${index} of ${files.length} files uploaded, then "${file.name}" was rejected: ${failure.reason}`,
        {
          hint: failure.hint,
          fileName: failure.fileName,
          status: failure.status,
          uploaded: index,
          total: files.length,
          cause: failure,
        },
      );
    }
  }
}
