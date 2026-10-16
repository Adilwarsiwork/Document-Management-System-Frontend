import { useQuery } from "@tanstack/react-query";
import { fetchDocumentTags } from "../api/document-metadata.api";

export function useDocumentTags() {
  return useQuery({
    queryKey: ["document-tags"],
    queryFn: fetchDocumentTags,
  });
}
