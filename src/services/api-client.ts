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

  if (!axios.isAxiosError(error)) return false;

  // No response at all: connection refused, DNS failure, CORS block, or a
  // timeout, which axios reports without a response.
  if (error.response === undefined) return true;

  // The browser refuses to tell a CORS-blocked response from a 0 status.
  return error.response.status === 0;
}

// Reads the message the API sends back on a failed request.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data as { message?: string } | undefined;

  return data?.message || fallback;
}
