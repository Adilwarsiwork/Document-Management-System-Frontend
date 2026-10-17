import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PAGE_SIZE, searchDocuments } from "../api/document-search.api";
import { isNetworkFailure } from "../../../services/api-client";
import {
  isUsableCachedPage,
  readSearchPage,
  saveSearchPage,
} from "../../../services/search-cache";

import type { DocumentSearchFilters } from "../types/document-search.types";

export interface DocumentSearchResultPage {
  documents: Awaited<
    ReturnType<typeof searchDocuments>
  >["documents"];
  total: number;
  /** Which page the rows belong to; lags the request while loading. */
  page: number;
  /**
   * True when the rows came from the offline cache because the network could
   * not be reached. The page number and filters are absent from the cache key
   * being reused, so the caller must not read these as live values.
   */
  fromCache: boolean;
  /** When the cached copy was written, or null for a live result. */
  cachedAt: number | null;
}

// Loads a single page of ten documents: changing the page replaces the previous
// ten instead of appending to them. The page number travels with the data so the
// list keeps showing the previous page (and its label) until the next one
// arrives.
//
// Network first, cache second. A successful search is written to IndexedDB so it
// survives a drop; a network failure falls back to the copy written for the
// same filters and page, and says so via `fromCache`. Every other failure is
// rethrown, because cached rows would disguise a real error.
export function useDocumentSearch(
  filters: DocumentSearchFilters | null,
  page: number
) {
  return useQuery({
    queryKey: ["document-search", filters, page],
    queryFn: async (): Promise<DocumentSearchResultPage> => {
      try {
        const result = await searchDocuments(
          filters as DocumentSearchFilters,
          page * PAGE_SIZE
        );

        void saveSearchPage(
          filters as DocumentSearchFilters,
          page,
          result,
        );

        return { ...result, page, fromCache: false, cachedAt: null };
      } catch (error) {
        if (!isNetworkFailure(error)) throw error;

        const cached = await readSearchPage(
          filters as DocumentSearchFilters,
          page,
        );

        // Nothing cached for this exact search, so the original failure stands
        // and the UI shows a real error rather than an empty list.
        if (!isUsableCachedPage(cached)) throw error;

        return {
          documents: cached.documents,
          total: cached.total,
          page,
          fromCache: true,
          cachedAt: cached.cachedAt,
        };
      }
    },
    enabled: filters !== null,
    placeholderData: keepPreviousData,
  });
}