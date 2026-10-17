import { type Dispatch, type SetStateAction } from "react";

import { MINOR_HEAD_OPTIONS } from "../constants/minor-head.constants";
import { todayIso } from "../utils/date.utils";

import DocumentTagInput from "./DocumentTagInput";
import DateInput from "./DateInput";

import type {
  DocumentUploadMetadata,
  MajorHead,
  DocumentTag,
} from "../types/document-metadata.types";

interface DocumentMetadataFieldsProps {
  value: DocumentUploadMetadata;
  onChange: Dispatch<SetStateAction<DocumentUploadMetadata>>;
  existingTags: DocumentTag[];
  isLoadingTags: boolean;
  tagsError: boolean;
  disabled?: boolean;
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClass = "text-sm font-medium text-slate-700";

export default function DocumentMetadataFields({
  value,
  onChange,
  existingTags,
  isLoadingTags,
  tagsError,
  disabled = false,
}: DocumentMetadataFieldsProps) {
  const minorHeads = MINOR_HEAD_OPTIONS[value.major_head] ?? [];

  const updateField = <K extends keyof DocumentUploadMetadata>(
    field: K,
    fieldValue: DocumentUploadMetadata[K],
  ) => {
    onChange((previous) => ({
      ...previous,
      [field]: fieldValue,
    }));
  };

  const handleMajorHeadChange = (majorHead: MajorHead) => {
    onChange((previous) => ({
      ...previous,
      major_head: majorHead,
      minor_head: "",
    }));
  };

  // Rejects dates that do not exist or fall in the future.
  const validateDocumentDate = (dateString: string): string | undefined => {
    if (!dateString) return undefined;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return "Please select a valid date.";
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return "Please select a valid date.";
    }

    if (dateString > todayIso()) {
      return "Future dates are not allowed.";
    }

    return undefined;
  };

  return (
    <section className="mt-7 border-t border-slate-100 pt-6">
      <div className="mb-5">
        <h4 className="text-base font-semibold text-slate-900">
          Document details
        </h4>
        <p className="mt-1 text-sm text-slate-500">
          Add metadata to help organize and find your documents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="document-date" className={labelClass}>
            Document date <span className="text-red-500">*</span>
          </label>

          <DateInput
            id="document-date"
            value={value.documentDate ?? ""}
            onChange={(date) => updateField("documentDate", date)}
            max={todayIso()}
            required
            disabled={disabled}
            validate={validateDocumentDate}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="major-head" className={labelClass}>
            Category <span className="text-red-500">*</span>
          </label>

          <select
            id="major-head"
            required
            disabled={disabled}
            value={value.major_head}
            onChange={(event) =>
              handleMajorHeadChange(event.target.value as MajorHead)
            }
            className={inputClass}
          >
            <option value="Personal">Personal</option>
            <option value="Professional">Professional</option>
            <option value="Company">Company</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="minor-head" className={labelClass}>
            {value.major_head === "Personal" ? "Name" : "Department"}{" "}
            <span className="text-red-500">*</span>
          </label>

          <select
            id="minor-head"
            required
            disabled={disabled}
            value={value.minor_head ?? ""}
            onChange={(event) => updateField("minor_head", event.target.value)}
            className={inputClass}
          >
            <option value="">
              Select{" "}
              {value.major_head === "Personal" ? "a name" : "a department"}
            </option>

            {minorHeads.map((option) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="document-tag-input" className={labelClass}>
            Document tags <span className="text-red-500">*</span>
          </label>

          <div className="mt-1.5">
            <DocumentTagInput
              id="document-tag-input"
              value={Array.isArray(value.tags) ? value.tags : []}
              onChange={(tags) => updateField("tags", tags)}
              existingTags={existingTags}
              isLoading={isLoadingTags}
              isError={tagsError}
              disabled={disabled}
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Type a tag and press Enter, or pick from the suggestions below.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="document-remarks" className={labelClass}>
            Remarks <span className="text-red-500">*</span>
          </label>

          <textarea
            id="document-remarks"
            required
            rows={3}
            disabled={disabled}
            value={value.remarks ?? ""}
            onChange={(event) => updateField("remarks", event.target.value)}
            placeholder="Add a note about this document..."
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>
    </section>
  );
}
