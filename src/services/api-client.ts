import axios from "axios";
import { getAuthToken } from "./auth-session";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.set("token", token);
  }

  // Without this, axios serializes FormData as JSON and the file is lost.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

export interface ApiErrorOptions {
  status?: number;
  responseData?: unknown;
  code?: string;
  isNetwork?: boolean;
  cause?: unknown;
}

/**
 * A failure raised by the API layer.
 *
 * It carries the message the server sent back (or a readable reason when it
 * sent none) plus the status and raw body, so every caller can show exactly
 * what the API returned instead of a generic fallback.
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly responseData?: unknown;
  readonly code?: string;
  readonly isNetwork: boolean;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause });

    this.name = "ApiError";
    this.status = options.status;
    this.responseData = options.responseData;
    this.code = options.code;
    this.isNetwork = options.isNetwork ?? false;
  }
}

// Walks a response body of any shape and returns the first human-readable
// message it can find. The API has been seen to nest its message under `data`,
// return it as a bare string, and report validation problems as a map of field
// names to messages, so all of those are handled here.
function readMessage(value: unknown, depth = 0): string {
  if (depth > 4 || value === null || value === undefined) return "";

  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => readMessage(entry, depth + 1))
      .filter(Boolean);

    return messages.join(", ");
  }

  if (typeof value !== "object") return "";

  const record = value as Record<string, unknown>;

  for (const key of [
    "message",
    "error",
    "msg",
    "detail",
    "reason",
    "description",
    "title",
  ]) {
    const found = readMessage(record[key], depth + 1);

    if (found) return found;
  }

  // Field-specific validation errors: { errors: { email: "is required" } }.
  const errors = record.errors;

  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const messages = Object.values(errors as Record<string, unknown>)
      .map((entry) => readMessage(entry, depth + 1))
      .filter(Boolean);

    if (messages.length > 0) return messages.join(", ");
  }

  // Nested envelopes such as { data: { message } }.
  for (const key of ["data", "result", "response"]) {
    const found = readMessage(record[key], depth + 1);

    if (found) return found;
  }

  return "";
}

// Reads the message the API sent back, whatever shape it arrived in.
export function extractApiMessage(data: unknown, fallback: string): string {
  return readMessage(data, 0) || fallback;
}

// The API answers with HTTP 200 even when it rejects a request, so a
// `status: false` envelope is turned into an error here. Doing it in one place
// means every call site surfaces the server's own message instead of a generic
// fallback.
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as { status?: unknown } | undefined;

    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      data.status === false
    ) {
      throw new ApiError(
        extractApiMessage(
          data,
          `The server rejected the request (HTTP ${response.status}).`,
        ),
        {
          status: response.status,
          responseData: data,
          cause: response,
        },
      );
    }

    return response;
  },
  (error: unknown) => {
    if (error instanceof ApiError) throw error;

    const axiosError = axios.isAxiosError(error) ? error : undefined;
    const response = axiosError?.response;
    const data = response?.data;

    // No response at all: connection refused, DNS failure, CORS block, or a
    // timeout, which axios reports without a response.
    if (!response) {
      throw new ApiError(
        axiosError?.code === "ECONNABORTED"
          ? "The request timed out. Check your connection and try again."
          : "Could not reach the server. Check your internet connection and try again.",
        {
          code: axiosError?.code,
          isNetwork: true,
          cause: error,
        },
      );
    }

    throw new ApiError(
      extractApiMessage(
        data,
        `The server returned an error (HTTP ${response.status}).`,
      ),
      {
        status: response.status,
        responseData: data,
        code: axiosError?.code,
        cause: error,
      },
    );
  },
);

/**
 * True only when the request never reached the server.
 *
 * This is the one failure a cached copy can stand in for. A 401 means the
 * session ended and the user needs to log in; a 500 or a `status: false` body
 * means the server answered and something is wrong with the request or the data.
 * Serving cached documents for either would hide a real problem behind plausible
 * looking results, so they are deliberately excluded.
 */
export function isNetworkFailure(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  if (error instanceof ApiError) return error.isNetwork;

  if (!axios.isAxiosError(error)) return false;

  // No response at all: connection refused, DNS failure, CORS block, or a
  // timeout, which axios reports without a response.
  if (error.response === undefined) return true;

  // The browser refuses to tell a CORS-blocked response from a 0 status.
  return error.response.status === 0;
}

// Reads the message the API sent back on a failed request.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (axios.isAxiosError(error)) {
    const message = extractApiMessage(error.response?.data, "");

    if (message) return message;

    if (!error.response) {
      return error.code === "ECONNABORTED"
        ? "The request timed out. Check your connection and try again."
        : "Could not reach the server. Check your internet connection and try again.";
    }

    return `The server returned an error (HTTP ${error.response.status}).`;
  }

  if (error instanceof Error) return error.message || fallback;

  return fallback;
}
