export type MajorHead = "Personal" | "Professional" | "Company";

export interface MinorHeadOption {
  id?: string | number;
  name: string;
  value: string;
  count?: number;
}

export interface DocumentTag {
  id?: string | number;
  name: string;
}

export interface DocumentUploadMetadata {
  documentDate: string;
  major_head: MajorHead;
  minor_head: string;
  tags: string[];
  remarks: string;
}

export interface DocumentMetadataOption {
  id?: string | number;
  name: string;
}
