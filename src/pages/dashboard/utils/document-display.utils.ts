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
