import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  FolderOpen,
  FolderTree,
  Hash,
  Link2,
  ListOrdered,
  LoaderCircle,
  RotateCcw,
  Search,
  UserRound,
} from "lucide-react";

import { getApiErrorMessage } from "../../../services/api-client";
import { PAGE_SIZE } from "../api/document-search.api";
import { MINOR_HEAD_OPTIONS } from "../constants/minor-head.constants";
import { useDocumentTags } from "../hooks/useDocumentMetadata";
import { useDocumentSearch } from "../hooks/useDocumentSearch";
import {
  formatDateTimeWithSeconds,
  formatDisplayDate,
  formatRelativeTime,
  todayIso,
} from "../utils/date.utils";
import {
  categoryStyle,
  fileTypeStyle,
  uploaderDisplay,
} from "../utils/document-display.utils";
import {
  downloadFile,
  fileExtensionFromName,
  fileNameFromUrl,
  getFileIcon,
} from "../utils/file.utils";
import DateInput from "./DateInput";
import DocumentTagInput from "./DocumentTagInput";

import type { MajorHead } from "../types/document-metadata.types";
import type {
  DocumentSearchFilters,
  DocumentSearchResult,
} from "../types/document-search.types";

const EMPTY_FILTERS: DocumentSearchFilters = {
  majorHead: "",
  minorHead: "",
  tags: [],
  fromDate: "",
  toDate: "",
  keyword: "",
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const labelClass = "text-sm font-medium text-slate-700";

// Tags get a slightly heavier chip than the rest of the chrome, because they can
// be the main reason someone ran the search.
const tagClass =
  "inline-flex items-center rounded-full bg-indigo-50/80 px-2.5 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200/70 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-indigo-100/80";

// The raw key name sent by /searchDocumentEntry, printed on every field so the
// data on screen stays traceable to the response it came from.
const fieldLabelClass =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400";

// Two stacked shadows — a tight contact shadow plus a wide, heavily diffused one —
// so a lifted card keeps a believable edge against the page.
const cardLift =
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-10px_rgba(15,23,42,0.10)]";

const cardLiftHover =
  "hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_24px_50px_-16px_rgba(79,70,229,0.20)]";

// One spring-like curve for every state change inside a row, so nothing quietly
// falls back to the browser's default easing.
const spring = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

// Row entrances are staggered by index. The tail is capped so the last row of a
// long page is not left waiting.
const ROW_STAGGER_MS = 45;
const MAX_STAGGERED_ROWS = 8;

export default function DocumentSearchSection() {
  const [filters, setFilters] = useState<DocumentSearchFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<DocumentSearchFilters | null>(null);
  const [page, setPage] = useState(0);
  const [rangeError, setRangeError] = useState("");

  const {
    data: existingTags = [],
    isLoading: isLoadingTags,
    isError: tagsError,
  } = useDocumentTags();

  const { data, isFetching, isError, error } = useDocumentSearch(
    appliedFilters,
    page
  );

  const documents = data?.documents ?? [];
  const total = data?.total ?? 0;
  // The page the visible data belongs to; it lags the requested page while the
  // next one loads, so the label always matches what is on screen.
  const currentPage = data?.page ?? page;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const minorHeads = filters.majorHead
    ? MINOR_HEAD_OPTIONS[filters.majorHead]
    : [];

  const errorMessage = isError
    ? getApiErrorMessage(error, "The search could not be completed.")
    : "";

  const setFilter = <K extends keyof DocumentSearchFilters>(
    field: K,
    value: DocumentSearchFilters[K]
  ) => {
    setFilters((previous) => ({ ...previous, [field]: value }));
  };

  const applySearch = () => {
    if (
      filters.fromDate &&
      filters.toDate &&
      filters.fromDate > filters.toDate
    ) {
      setRangeError("The from date must be on or before the to date.");
      return;
    }

    setRangeError("");
    // A new search always starts from the first page.
    setPage(0);
    setAppliedFilters({ ...filters });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch();
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setRangeError("");
    setPage(0);
    setAppliedFilters(null);
  };

  return (
    <section
      id="documents"
      className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FileSearch size={21} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Search documents</h3>
            <p className="mt-1 text-xs text-slate-500">
              Filter stored documents by category, tag or date.
            </p>
          </div>
        </div>

        {appliedFilters && (
          <span className="text-xs text-slate-500">
            {total} result{total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-b border-slate-100 p-5 sm:p-7"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="search-major-head" className={labelClass}>
              Category
            </label>

            <select
              id="search-major-head"
              value={filters.majorHead}
              onChange={(event) =>
                setFilter("majorHead", event.target.value as MajorHead | "")
              }
              className={inputClass}
            >
              <option value="">All categories</option>
              <option value="Personal">Personal</option>
              <option value="Professional">Professional</option>
              <option value="Company">Company</option>
            </select>
          </div>

          <div>
            <label htmlFor="search-minor-head" className={labelClass}>
              {filters.majorHead === "Personal" ? "Name" : "Department"}
            </label>

            <select
              id="search-minor-head"
              value={filters.minorHead}
              disabled={!filters.majorHead}
              onChange={(event) => setFilter("minorHead", event.target.value)}
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
            >
              <option value="">
                {filters.majorHead ? "All" : "Select a category first"}
              </option>

              {minorHeads.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="search-tag-input" className={labelClass}>
              Tags
            </label>

            <div className="mt-1.5">
              <DocumentTagInput
                id="search-tag-input"
                value={filters.tags}
                onChange={(tags) => setFilter("tags", tags)}
                existingTags={existingTags}
                isLoading={isLoadingTags}
                isError={tagsError}
                placeholder="Type a tag and press Enter..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="search-from-date" className={labelClass}>
              From date
            </label>

            <DateInput
              id="search-from-date"
              value={filters.fromDate}
              onChange={(date) => setFilter("fromDate", date)}
              max={filters.toDate || todayIso()}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="search-to-date" className={labelClass}>
              To date
            </label>

            <DateInput
              id="search-to-date"
              value={filters.toDate}
              onChange={(date) => setFilter("toDate", date)}
              min={filters.fromDate || undefined}
              max={todayIso()}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="search-keyword" className={labelClass}>
              Keyword
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="search-keyword"
                type="search"
                value={filters.keyword}
                onChange={(event) => setFilter("keyword", event.target.value)}
                placeholder="Search by document name..."
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
        </div>

        {rangeError && (
          <p role="alert" className="mt-4 text-xs text-red-600">
            {rangeError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="submit"
            disabled={isFetching}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {isFetching && <LoaderCircle size={17} className="animate-spin" />}
            {isFetching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      <div className="p-5 sm:p-7">
        {!appliedFilters ? (
          <SearchMessage
            icon={<FolderOpen size={25} />}
            iconClass="bg-slate-100 text-slate-400"
            title="Run a search to see documents"
            description="Choose a category, add tags or set a date range, then select Search."
          />
        ) : isFetching && !data ? (
          <SearchSkeleton />
        ) : isError ? (
          <SearchMessage
            icon={<AlertTriangle size={25} />}
            iconClass="bg-red-50 text-red-500"
            title="Search failed"
            description={errorMessage}
          >
            <button
              type="button"
              onClick={applySearch}
              className="mt-4 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              Try again
            </button>
          </SearchMessage>
        ) : documents.length === 0 ? (
          <SearchMessage
            icon={<Search size={24} />}
            iconClass="bg-slate-100 text-slate-400"
            title="No matching documents"
            description="Try removing a filter or widening the date range."
          />
        ) : (
          <SearchResults
            documents={documents}
            total={total}
            page={currentPage}
            pageCount={pageCount}
            isFetching={isFetching}
            onPrevious={() => setPage((previous) => Math.max(0, previous - 1))}
            onNext={() =>
              setPage((previous) => Math.min(pageCount - 1, previous + 1))
            }
          />
        )}
      </div>
    </section>
  );
}

interface SearchMessageProps {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

function SearchMessage({
  icon,
  iconClass,
  title,
  description,
  children,
}: SearchMessageProps) {
  return (
    <div className="py-12 text-center sm:py-16">
      <div
        className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl ${iconClass}`}
      >
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {children}
    </div>
  );
}

interface SearchResultsProps {
  documents: DocumentSearchResult[];
  total: number;
  page: number;
  pageCount: number;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function SearchResults({
  documents,
  total,
  page,
  pageCount,
  isFetching,
  onPrevious,
  onNext,
}: SearchResultsProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const lastPageRef = useRef(page);

  // The cards scroll with the page instead of inside their own box, so a page
  // change brings the top of the results back into view.
  useEffect(() => {
    if (lastPageRef.current === page) return;

    lastPageRef.current = page;
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  const firstShown = documents.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastShown = page * PAGE_SIZE + documents.length;
  const isFirstPage = page === 0;
  const isLastPage = page >= pageCount - 1;

  return (
    <div ref={resultsRef} className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-slate-700">
            {total} document{total === 1 ? "" : "s"}
          </p>

          <p className="text-xs text-slate-400">
            Page {page + 1} of {pageCount}
          </p>
        </div>

        <PaginationControls
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
          isFetching={isFetching}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </div>

      <div
        role="region"
        aria-label="Search results"
        aria-busy={isFetching}
        className={`space-y-2.5 rounded-2xl bg-slate-50/60 p-2.5 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isFetching ? "opacity-60" : ""
        }`}
      >
        {documents.map((document, index) => (
          <SearchResultRow
            key={document.id}
            document={document}
            index={index}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Showing {firstShown}–{lastShown} of {total}
        </p>

        <PaginationControls
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
          isFetching={isFetching}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </div>
    </div>
  );
}

interface PaginationControlsProps {
  isFirstPage: boolean;
  isLastPage: boolean;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

// Rendered above and below the list so the page can be changed without
// scrolling to the other end of the results.
function PaginationControls({
  isFirstPage,
  isLastPage,
  isFetching,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  const buttonClass =
    "inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600 focus-visible:ring-4 focus-visible:ring-indigo-500/25";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstPage || isFetching}
        className={buttonClass}
      >
        <ChevronLeft size={15} />
        Previous
      </button>

      {isFetching && (
        <LoaderCircle
          size={15}
          aria-label="Loading page"
          className="animate-spin text-slate-400"
        />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={isLastPage || isFetching}
        className={buttonClass}
      >
        Next
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// Resolves the lucide icon for a file name. A plain helper (not a component)
// so the icon is not re-created during the row's render.
function fileTypeIcon(name: string, size: number, className?: string) {
  const Icon = getFileIcon(name || "file");

  return <Icon size={size} className={className} aria-hidden="true" />;
}

function SearchResultRow({
  document,
  index,
}: {
  document: DocumentSearchResult;
  index: number;
}) {
  // Named `category`, not `style`: this row also carries a `style` prop for the
  // entrance delay, and two things called `style` in one component is a trap.
  const category = categoryStyle(document.majorHead);
  const fileName = fileNameFromUrl(document.fileUrl);
  const fileStyle = fileTypeStyle(fileName);
  const extension = fileExtensionFromName(fileName);
  const canOpen = document.fileUrl.length > 0;
  const uploader = uploaderDisplay(document.uploadedBy);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "busy" | "error"
  >("idle");

  const handleDownload = async () => {
    if (!document.fileUrl || downloadStatus === "busy") return;

    setDownloadStatus("busy");

    try {
      await downloadFile(document.fileUrl, fileName);
      setDownloadStatus("idle");
    } catch {
      setDownloadStatus("error");
    }
  };

  return (
    <article
      style={{
        animationDelay: `${Math.min(index, MAX_STAGGERED_ROWS) * ROW_STAGGER_MS}ms`,
      }}
      className={`animate-result-in relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-900/[0.05] hover:ring-slate-900/[0.09] ${cardLift} ${spring} ${cardLiftHover}`}
    >
      {/* Category accent, faded at both ends so it reads as a lit edge rather than
          a hard colour block. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[3px] ${category.bar} [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]`}
      />

      <div className="flex items-start gap-4">
        {/* Type block: the icon over its extension, tinted by file type so the
            kind of document is readable without parsing the filename. */}
        <div
          className={`flex size-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl ring-1 ${fileStyle.tile} ${fileStyle.accent}`}
        >
          {fileTypeIcon(fileName, 22)}

          {extension && (
            <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">
              {extension}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-base font-bold tracking-tight text-slate-900"
            title={fileName || undefined}
          >
            {fileName || "Untitled document"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <IdBadge id={document.id} />

            {/* major_head and minor_head are separate API keys, so they get
                separate chips. The category is tinted by its own value and the
                sub-category stays neutral, which keeps the two distinguishable
                when several sit next to each other. */}
            {document.majorHead && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${category.chip}`}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${category.bar}`}
                />
                {document.majorHead}
              </span>
            )}

            {document.minorHead && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-900/[0.04]">
                <FolderTree size={11} aria-hidden="true" />
                {document.minorHead}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {canOpen && (
            <IconLink
              href={document.fileUrl}
              label="Open the file in a new tab"
              title="Open in a new tab"
            >
              <ExternalLink size={16} />
            </IconLink>
          )}

          <DownloadButton
            fileName={fileName}
            isBusy={downloadStatus === "busy"}
            disabled={!document.fileUrl}
            onDownload={handleDownload}
          />
        </div>
      </div>

      {/* Every field carries its API key, a formatted value and a plain-English
          qualifier, so the same data answers "what", "when" and "how long ago".
          One cell per key the endpoint returns. */}
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          field="document_date"
          icon={<CalendarDays size={13} />}
          value={formatDisplayDate(document.documentDate) || "—"}
          sub={formatRelativeTime(document.documentDate)}
        />

        <Field
          field="upload_time"
          icon={<Clock size={13} />}
          value={formatDateTimeWithSeconds(document.uploadedAt) || "—"}
          sub={formatRelativeTime(document.uploadedAt)}
        />

        <Field
          field="uploaded_by"
          icon={<UserRound size={13} />}
          value={uploader.name}
          sub={uploader.handle}
        />

        {/* Reported per row but describes the whole result set, so it reads the
            same on every card. Rendered because it is part of the response, not
            because it varies. */}
        {typeof document.totalCount === "number" && (
          <Field
            field="total_count"
            icon={<ListOrdered size={13} />}
            value={document.totalCount.toLocaleString()}
          />
        )}
      </dl>

      {document.tags.length > 0 && (
        <div className="mt-4">
          <p className={fieldLabelClass}>
            tags ({document.tags.length})
          </p>

          {/* Every tag is rendered; the block wraps rather than truncating. */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {document.tags.map((tag) => (
              <span key={tag} className={tagClass}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {document.remarks && (
        <div className="mt-4 rounded-xl bg-amber-50/60 px-3.5 py-3 ring-1 ring-amber-900/[0.06]">
          <p className={fieldLabelClass}>document_remarks</p>

          <p className="mt-1.5 text-xs leading-5 text-slate-700">
            {document.remarks}
          </p>
        </div>
      )}

      {document.fileUrl && (
        <div className="group/url mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50/80 px-3.5 py-3 ring-1 ring-slate-900/[0.04]">
          <Link2
            size={14}
            aria-hidden="true"
            className="shrink-0 text-rose-500"
          />

          <p
            className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-500"
            title={document.fileUrl}
          >
            {document.fileUrl}
          </p>

          <span className="opacity-50 transition-opacity duration-300 group-hover/url:opacity-100 group-focus-within/url:opacity-100">
              <CopyButton value={document.fileUrl} label="file URL" />
            </span>
          </div>
      )}

      {downloadStatus === "error" && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl bg-red-50/70 px-3.5 py-3 text-xs font-medium leading-5 text-red-700 ring-1 ring-red-900/[0.06]"
        >
          <AlertTriangle
            size={14}
            aria-hidden="true"
            className="mt-px shrink-0"
          />

          <span>
            This file could not be downloaded directly. Use Open to view or save
            it.
          </span>
        </p>
      )}
    </article>
  );
}

interface FieldProps {
  /** The key exactly as it arrives from the API. */
  field: string;
  icon: ReactNode;
  value: ReactNode;
  sub?: string;
}

function Field({ field, icon, value, sub }: FieldProps) {
  // An empty field is normal, not an error. Naming the absence reads better than
  // a lone dash, and keeps a gap in the data from looking like a rendering fault.
  const isEmpty = value === "—" || value === "";

  return (
    <div className="min-w-0 rounded-xl bg-slate-50/70 px-3.5 py-3 ring-1 ring-slate-900/[0.04]">
      <dt className={`flex items-center gap-1.5 ${fieldLabelClass}`} title={field}>
        {icon}
        {field}
      </dt>

      <dd
        className={`mt-1.5 truncate text-xs font-semibold ${
          isEmpty ? "text-slate-300" : "text-slate-800"
        }`}
        title={typeof value === "string" && !isEmpty ? value : undefined}
      >
        {isEmpty ? "Not recorded" : value}
      </dd>

      {sub && <p className="mt-0.5 truncate text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function IconLink({
  href,
  label,
  title,
  children,
}: {
  href: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={title}
      className={`group flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-900/[0.05] ${spring} hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-300/60 active:scale-95 focus-visible:ring-4 focus-visible:ring-indigo-500/25`}
    >
      {/* The glyph drifts and scales inside its own hit area, so the button reads
          as pressed rather than simply recoloured. */}
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110"
      >
        {children}
      </span>
    </a>
  );
}

function CopyButton({
  value,
  label,
  variant = "light",
}: {
  value: string;
  label: string;
  variant?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1600);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the value stays selectable on screen.
    }
  };

  const isDark = variant === "dark";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={
        isDark
          ? "flex size-5 shrink-0 items-center justify-center rounded-md text-white/70 transition hover:bg-white/15 hover:text-white focus-visible:ring-4 focus-visible:ring-white/30"
          : "flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-indigo-700 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-indigo-500/25"
      }
    >
      {copied ? (
        <Check size={isDark ? 11 : 14} className={isDark ? "text-emerald-300" : "text-emerald-500"} />
      ) : (
        <Copy size={isDark ? 11 : 14} />
      )}
    </button>
  );
}

// Prominent document id with an inline copy action.
function IdBadge({ id }: { id: string }) {
  return (
    <span className="group/id inline-flex h-5 shrink-0 items-center gap-1 rounded-md bg-slate-900 px-1.5 text-white">
      <Hash size={10} aria-hidden="true" className="text-white/50" />
      <span className="text-[10px] font-bold tabular-nums">{id}</span>
      <span className="opacity-50 transition-opacity duration-300 group-hover/id:opacity-100 group-focus-within/id:opacity-100">
        <CopyButton value={id} label="document ID" variant="dark" />
      </span>
    </span>
  );
}

function DownloadButton({
  fileName,
  isBusy,
  disabled,
  onDownload,
}: {
  fileName: string;
  isBusy: boolean;
  disabled: boolean;
  onDownload: () => void;
}) {
  const label = fileName ? `Download ${fileName}` : "Download this file";

  if (disabled) {
    return (
      <span
        title="No file available"
        aria-hidden="true"
        className="flex size-8 shrink-0 cursor-not-allowed items-center justify-center rounded-lg text-slate-300 ring-1 ring-slate-900/[0.03]"
      >
        <Download size={17} />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={isBusy}
      aria-label={label}
      title={label}
      className={`group flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-900/[0.05] ${spring} hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-300/60 active:scale-95 disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-indigo-500/25`}
    >
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110"
      >
        {isBusy ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <Download size={15} />
        )}
      </span>
    </button>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl bg-white p-5 ring-1 ring-slate-900/[0.05]"
        >
          {/* Mirrors the real card: type block, name, three field cells. */}
          <div className="flex items-start gap-4">
            <div className="size-14 shrink-0 rounded-2xl bg-slate-100" />

            <div className="min-w-0 flex-1">
              <div className="h-4 w-1/3 rounded-full bg-slate-100" />

              <div className="mt-2 flex gap-2">
                <div className="h-5 w-16 rounded bg-slate-100" />
                <div className="h-5 w-28 rounded-full bg-slate-100/80" />
              </div>
            </div>

            <div className="flex shrink-0 gap-1.5">
              <div className="size-10 rounded-xl bg-slate-100" />
              <div className="size-10 rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, cell) => (
              <div
                key={cell}
                className="h-[4.25rem] rounded-xl bg-slate-50"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
