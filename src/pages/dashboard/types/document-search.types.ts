import type { MajorHead } from "./document-metadata.types";

export interface DocumentSearchFilters {
  majorHead: MajorHead | "";
  minorHead: string;
  tags: string[];
  fromDate: string;
  toDate: string;
  keyword: string;
}

// Body sent to /searchDocumentEntry.
export interface DocumentSearchRequest {
  major_head: string;
  minor_head: string;
  from_date: string;
  to_date: string;
  tags: { tag_name: string }[];
  uploaded_by: string;
  start: number;
  length: number;
  filterId: string;
  search: { value: string };
}

export interface DocumentSearchResult {
  id: string;
  fileUrl: string;
  documentDate: string;
  majorHead: string;
  minorHead: string;
  remarks: string;
  // A document can carry any number of tags. When the response has no `tags`
  // field they are recovered from the remarks, which is why remarks is emptied
  // in that case rather than shown twice.
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  totalCount?: number;
}

export interface DocumentSearchPage {
  documents: DocumentSearchResult[];
  total: number;
}
