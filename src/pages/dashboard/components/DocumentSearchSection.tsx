import { useMemo, useState } from "react";
import { Clock3, FileSearch, FolderOpen, Search } from "lucide-react";
import type { SelectedDocument } from "../types/document.types";
import { formatFileSize, getFileIcon } from "../utils/file.utils";

interface DocumentSearchSectionProps {
  files: SelectedDocument[];
  onRemoveFile: (id: string) => void;
}

export default function DocumentSearchSection({
  files,
}: DocumentSearchSectionProps) {
  const [query, setQuery] = useState("");

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return files.filter(({ file }) =>
      file.name.toLowerCase().includes(normalizedQuery),
    );
  }, [files, query]);

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
              Find selected files by name.
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-500">
          {filteredFiles.length} result{filteredFiles.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by document name..."
            aria-label="Search documents by name"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_130px] gap-4 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:grid">
            <span>Document</span>
            <span>Size</span>
            <span>Status</span>
          </div>

          {filteredFiles.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredFiles.map(({ id, file }) => {
                const Icon = getFileIcon(file.name);

                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 px-4 py-4 sm:grid sm:grid-cols-[minmax(0,1fr)_110px_130px] sm:gap-4 sm:px-5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 sm:hidden">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <span className="hidden text-sm text-slate-600 sm:block">
                      {formatFileSize(file.size)}
                    </span>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      <Clock3 size={12} />
                      Not uploaded
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center sm:py-16">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                {query ? <Search size={24} /> : <FolderOpen size={25} />}
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                {query ? "No matching documents" : "No documents to display"}
              </h4>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {query
                  ? "Try another search term or clear the search field."
                  : "Selected files will appear here. Connect the document search API to retrieve stored files."}
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          This search filters files selected in the current page. It does not
          search documents stored on the server.
        </p>
      </div>
    </section>
  );
}
