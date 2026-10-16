import {
  useState,
  type Dispatch,
  type SetStateAction,
  type KeyboardEvent,
} from "react";
import { ChevronDown, X } from "lucide-react";

import { MINOR_HEAD_OPTIONS } from "../constants/minor-head.constants";

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

// Number of tag suggestions shown before the user expands the list.
const COLLAPSED_TAG_LIMIT = 8;

export default function DocumentMetadataFields({
  value,
  onChange,
  existingTags,
  isLoadingTags,
  tagsError,
  disabled = false,
}: DocumentMetadataFieldsProps) {
  const minorHeads = MINOR_HEAD_OPTIONS[value.major_head] ?? [];

  const [tagInput, setTagInput] = useState("");
  const [isTagListExpanded, setIsTagListExpanded] = useState(false);

  // Safely handle potentially missing or invalid tag arrays.
  const selectedTags = Array.isArray(value.tags) ? value.tags : [];
  const apiTags = Array.isArray(existingTags) ? existingTags : [];

  // Keep only valid string tags from the selected values.
  const validSelectedTags = selectedTags.filter(
    (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
  );

  // Keep only API tags with a valid name.
  const validExistingTags = apiTags.filter(
    (tag): tag is DocumentTag & { name: string } =>
      typeof tag?.name === "string" && tag.name.trim().length > 0,
  );

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

  // Add a tag from the API list or typed by the user; ignores duplicates.
  const addTag = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    const normalizedName = trimmedName.toLowerCase();

    onChange((previous) => {
      const previousTags = Array.isArray(previous.tags)
        ? previous.tags.filter((tag): tag is string => typeof tag === "string")
        : [];

      const alreadySelected = previousTags.some(
        (tag) => tag.trim().toLowerCase() === normalizedName,
      );

      return {
        ...previous,
        tags: alreadySelected ? previousTags : [...previousTags, trimmedName],
      };
    });
  };

  const addTagAndClear = (name: string) => {
    addTag(name);
    setTagInput("");
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      // Prevents the surrounding form from submitting on Enter.
      event.preventDefault();
      addTagAndClear(tagInput);
      return;
    }

    if (event.key === "Escape") {
      setTagInput("");
    }
  };

  const selectedTagNames = new Set(
    validSelectedTags.map((tag) => tag.trim().toLowerCase()),
  );

  const normalizedInput = tagInput.trim().toLowerCase();

  // Suggestions narrow down as the user types.
  const suggestedTags = validExistingTags.filter(
    (tag) =>
      !selectedTagNames.has(tag.name.trim().toLowerCase()) &&
      (!normalizedInput ||
        tag.name.trim().toLowerCase().includes(normalizedInput)),
  );

  // True when the typed text does not match any fetched tag.
  const isNewTag =
    normalizedInput.length > 0 &&
    !validExistingTags.some(
      (tag) => tag.name.trim().toLowerCase() === normalizedInput,
    );

  const visibleSuggestions = isTagListExpanded
    ? suggestedTags
    : suggestedTags.slice(0, COLLAPSED_TAG_LIMIT);

  const hiddenSuggestionCount = suggestedTags.length - COLLAPSED_TAG_LIMIT;

  // Returns today's date in local YYYY-MM-DD format.
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Validates that a date exists and is not in the future.
  const isValidDocumentDate = (dateString: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return false;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }

    return dateString <= getTodayDate();
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

          <input
            id="document-date"
            type="date"
            required
            disabled={disabled}
            max={getTodayDate()}
            value={value.documentDate ?? ""}
            onClick={(event) => {
              try {
                event.currentTarget.showPicker?.();
              } catch {
                // The browser may open the calendar automatically.
              }
            }}
            onChange={(event) => {
              const selectedDate = event.target.value;

              if (!selectedDate) {
                event.target.setCustomValidity("");
                updateField("documentDate", "");
                return;
              }

              if (!isValidDocumentDate(selectedDate)) {
                event.target.setCustomValidity(
                  "Please select a valid date that is today or earlier.",
                );
                event.target.reportValidity();
                updateField("documentDate", "");
                return;
              }

              event.target.setCustomValidity("");
              updateField("documentDate", selectedDate);
            }}
            onBlur={(event) => {
              if (
                event.target.value &&
                !isValidDocumentDate(event.target.value)
              ) {
                event.target.setCustomValidity("Future dates are not allowed.");
                event.target.reportValidity();
                updateField("documentDate", "");
              } else {
                event.target.setCustomValidity("");
              }
            }}
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

          <div className="mt-1.5 rounded-xl border border-slate-200 bg-white p-3 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
            {validSelectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {validSelectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700"
                  >
                    {tag}

                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`Remove ${tag} tag`}
                      onClick={() =>
                        updateField(
                          "tags",
                          validSelectedTags.filter((item) => item !== tag),
                        )
                      }
                      className="rounded p-0.5 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              id="document-tag-input"
              type="text"
              value={tagInput}
              disabled={disabled}
              onChange={(event) => {
                setTagInput(event.target.value);
                // A new search always starts from the collapsed list.
                setIsTagListExpanded(false);
              }}
              onKeyDown={handleTagInputKeyDown}
              placeholder={
                validSelectedTags.length > 0
                  ? "Add another tag..."
                  : "Type a tag and press Enter..."
              }
              aria-label="Add a document tag"
              className={`${validSelectedTags.length > 0 && "mt-2"} w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed`}
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Type a tag and press Enter, or pick from the suggestions below.
          </p>

          {isLoadingTags && (
            <p className="mt-2 text-xs text-slate-500">
              Loading existing tags...
            </p>
          )}

          {tagsError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              Could not load existing tags. You can still type your own tags.
            </p>
          )}

          {!isLoadingTags && (suggestedTags.length > 0 || isNewTag) && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {isNewTag && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => addTagAndClear(tagInput)}
                    className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                  >
                    + Create "{tagInput.trim()}"
                  </button>
                )}

                {visibleSuggestions.map((tag) => (
                  <button
                    key={tag.id ?? tag.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => addTagAndClear(tag.name)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>

              {hiddenSuggestionCount > 0 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setIsTagListExpanded((expanded) => !expanded)}
                  aria-expanded={isTagListExpanded}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:opacity-50"
                >
                  {isTagListExpanded
                    ? "Show less"
                    : `Show ${hiddenSuggestionCount} more`}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      isTagListExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          )}

          {!isLoadingTags &&
            !tagsError &&
            !normalizedInput &&
            validExistingTags.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                No existing tags are available. Type to create one.
              </p>
            )}
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
