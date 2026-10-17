import { useState, type KeyboardEvent } from "react";
import { ChevronDown, X } from "lucide-react";

import type { DocumentTag } from "../types/document-metadata.types";

// Number of suggestions shown before the list is expanded.
const COLLAPSED_LIMIT = 8;

interface DocumentTagInputProps {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  existingTags: DocumentTag[];
  isLoading?: boolean;
  isError?: boolean;
  disabled?: boolean;
  placeholder?: string;
  errorHint?: string;
  emptyHint?: string;
}

export default function DocumentTagInput({
  id,
  value,
  onChange,
  existingTags,
  isLoading = false,
  isError = false,
  disabled = false,
  placeholder,
  errorHint = "Could not load existing tags. You can still type your own tags.",
  emptyHint = "No existing tags are available. Type to create one.",
}: DocumentTagInputProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const selected = Array.isArray(value) ? value : [];
  const available = Array.isArray(existingTags) ? existingTags : [];

  const selectedNames = new Set(
    selected.map((tag) => tag.trim().toLowerCase())
  );
  const keyword = input.trim().toLowerCase();

  const addTag = (name: string) => {
    const trimmed = name.trim();

    if (!trimmed) return;

    if (selectedNames.has(trimmed.toLowerCase())) return;

    onChange([...selected, trimmed]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      // Stops the surrounding form from submitting.
      event.preventDefault();
      addTag(input);
      setInput("");
      return;
    }

    if (event.key === "Escape") {
      setInput("");
    }
  };

  const suggestions = available.filter(
    (tag) =>
      typeof tag?.name === "string" &&
      tag.name.trim() &&
      !selectedNames.has(tag.name.trim().toLowerCase()) &&
      (!keyword || tag.name.trim().toLowerCase().includes(keyword))
  );

  const isNewTag =
    keyword.length > 0 &&
    !available.some((tag) => tag.name?.trim().toLowerCase() === keyword);

  const visible = isExpanded
    ? suggestions
    : suggestions.slice(0, COLLAPSED_LIMIT);
  const hidden = suggestions.length - COLLAPSED_LIMIT;

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-3 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((tag) => (
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
                    onChange(selected.filter((item) => item !== tag))
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
          id={id}
          type="text"
          value={input}
          disabled={disabled}
          onChange={(event) => {
            setInput(event.target.value);
            // A new search starts from the collapsed list.
            setIsExpanded(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ??
            (selected.length > 0
              ? "Add another tag..."
              : "Type a tag and press Enter...")
          }
          aria-label="Document tags"
          className={`${
            selected.length > 0 && "mt-2"
          } w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed`}
        />
      </div>

      {isLoading && (
        <p className="mt-2 text-xs text-slate-500">Loading existing tags...</p>
      )}

      {isError && <p className="mt-2 text-xs text-red-600">{errorHint}</p>}

      {!isLoading && (suggestions.length > 0 || isNewTag) && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {isNewTag && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  addTag(input);
                  setInput("");
                }}
                className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
              >
                + Create "{input.trim()}"
              </button>
            )}

            {visible.map((tag) => (
              <button
                key={tag.id ?? tag.name}
                type="button"
                disabled={disabled}
                onClick={() => {
                  addTag(tag.name);
                  setInput("");
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
              >
                + {tag.name}
              </button>
            ))}
          </div>

          {hidden > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsExpanded((expanded) => !expanded)}
              aria-expanded={isExpanded}
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:opacity-50"
            >
              {isExpanded ? "Show less" : `Show ${hidden} more`}
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && !keyword && available.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">{emptyHint}</p>
      )}
    </>
  );
}
