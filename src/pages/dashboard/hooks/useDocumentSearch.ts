import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PAGE_SIZE, searchDocuments } from "../api/document-search.api";

import type { DocumentSearchFilters } from "../types/document-search.types";

// Loads a single page of ten documents: changing the page replaces the previous
// ten instead of appending to them. The page number travels with the data so
// the list keeps showing the previous page (and its label) until the next one
// arrives.
export function useDocumentSearch(
  filters: DocumentSearchFilters | null,
  page: number
) {
  return useQuery({
    queryKey: ["document-search", filters, page],
    queryFn: async () => ({
      ...(await searchDocuments(
        filters as DocumentSearchFilters,
        page * PAGE_SIZE
      )),
      page,
    }),
    enabled: filters !== null,
    placeholderData: keepPreviousData,
  });
}
