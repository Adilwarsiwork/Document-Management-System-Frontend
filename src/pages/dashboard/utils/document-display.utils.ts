// Display helpers shared by the document search results.

export interface CategoryStyle {
  /** Small labelled chip (category badge). */
  chip: string;
  /** Accent bar colour for the left edge of a result card. */
  bar: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  Personal: {
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    bar: "bg-emerald-400",
  },
  Professional: {
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
    bar: "bg-indigo-400",
  },
  Company: {
    chip: "bg-amber-50 text-amber-700 ring-amber-200/70",
    bar: "bg-amber-400",
  },
};

const DEFAULT_STYLE: CategoryStyle = {
  chip: "bg-slate-50 text-slate-600 ring-slate-200/70",
  bar: "bg-slate-300",
};

export function categoryStyle(majorHead: string): CategoryStyle {
  return CATEGORY_STYLES[majorHead] ?? DEFAULT_STYLE;
}

export interface FileTypeStyle {
  /** Background and ring for the file-type tile. */
  tile: string;
  /** Icon and extension text colour. */
  accent: string;
}

const PDF_STYLE: FileTypeStyle = {
  tile: "bg-rose-50 ring-rose-200/70",
  accent: "text-rose-600",
};

const DOC_STYLE: FileTypeStyle = {
  tile: "bg-sky-50 ring-sky-200/70",
  accent: "text-sky-600",
};

const SHEET_STYLE: FileTypeStyle = {
  tile: "bg-emerald-50 ring-emerald-200/70",
  accent: "text-emerald-600",
};

const SLIDES_STYLE: FileTypeStyle = {
  tile: "bg-orange-50 ring-orange-200/70",
  accent: "text-orange-600",
};

const IMAGE_STYLE: FileTypeStyle = {
  tile: "bg-violet-50 ring-violet-200/70",
  accent: "text-violet-600",
};

const ARCHIVE_STYLE: FileTypeStyle = {
  tile: "bg-slate-50 ring-slate-200/70",
  accent: "text-slate-500",
};

// Colouring by extension means a page of results can be scanned by shape and
// hue alone, without reading a single filename.
const FILE_TYPE_STYLES: Record<string, FileTypeStyle> = {
  pdf: PDF_STYLE,

  doc: DOC_STYLE,
  docx: DOC_STYLE,
  odt: DOC_STYLE,
  rtf: DOC_STYLE,
  txt: DOC_STYLE,
  md: DOC_STYLE,
  json: DOC_STYLE,
  xml: DOC_STYLE,

  xls: SHEET_STYLE,
  xlsx: SHEET_STYLE,
  ods: SHEET_STYLE,
  csv: SHEET_STYLE,

  ppt: SLIDES_STYLE,
  pptx: SLIDES_STYLE,
  odp: SLIDES_STYLE,

  jpg: IMAGE_STYLE,
  jpeg: IMAGE_STYLE,
  png: IMAGE_STYLE,
  gif: IMAGE_STYLE,
  webp: IMAGE_STYLE,
  avif: IMAGE_STYLE,
  bmp: IMAGE_STYLE,
  svg: IMAGE_STYLE,

  zip: ARCHIVE_STYLE,
  rar: ARCHIVE_STYLE,
  "7z": ARCHIVE_STYLE,
  tar: ARCHIVE_STYLE,
  gz: ARCHIVE_STYLE,
};

const DEFAULT_FILE_TYPE_STYLE: FileTypeStyle = {
  tile: "bg-slate-50 ring-slate-200/70",
  accent: "text-slate-500",
};

export function fileTypeStyle(fileName: string): FileTypeStyle {
  // A name with no dot yields the whole name, which simply will not match.
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return FILE_TYPE_STYLES[extension] ?? DEFAULT_FILE_TYPE_STYLE;
}

// The uploader is a user name in some records and a numeric id in others.
export function uploaderDisplay(uploadedBy: string): {
  name: string;
  handle: string;
} {
  const value = uploadedBy?.trim() ?? "";

  if (!value) {
    return { name: "Unknown uploader", handle: "No uploader recorded" };
  }

  if (/^\d+$/.test(value)) {
    return { name: `User #${value}`, handle: "Uploader user ID" };
  }

  return { name: value, handle: "Uploaded this document" };
}
