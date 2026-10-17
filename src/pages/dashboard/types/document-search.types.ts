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
  uploadedBy: string;
  uploadedAt: string;
  totalCount?: number;
}

export interface DocumentSearchPage {
  documents: DocumentSearchResult[];
  total: number;
}
