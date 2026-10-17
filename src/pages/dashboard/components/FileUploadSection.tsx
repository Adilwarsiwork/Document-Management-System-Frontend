import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { CloudUpload, LoaderCircle, Plus, X } from "lucide-react";

import type { SelectedDocument } from "../types/document.types";
import type { DocumentUploadMetadata } from "../types/document-metadata.types";

import { formatFileSize, getFileIcon } from "../utils/file.utils";
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_LABEL,
  MAX_FILE_SIZE_LABEL,
  validateFiles,
  type InvalidFile,
} from "../utils/file-validation.utils";

import { useDocumentTags } from "../hooks/useDocumentMetadata";

import Toast, {
  type ToastMessage,
  type ToastMeta,
} from "../../../components/common/Toast";
import { UploadError } from "../api/document-upload.api";
import DocumentMetadataFields from "./DocumentMetadataFields";
import FileValidationDialog from "./FileValidationDialog";

interface FileUploadSectionProps {
  files: SelectedDocument[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onUpload: (
    files: SelectedDocument[],
    metadata: DocumentUploadMetadata,
  ) => Promise<void>;
}

const INITIAL_METADATA: DocumentUploadMetadata = {
  documentDate: "",
  major_head: "Personal",
  minor_head: "",
  tags: [],
  remarks: "",
};

// Summarises what was stored, using the same labels as the form itself.
const buildSuccessMeta = (
  files: SelectedDocument[],
  metadata: DocumentUploadMetadata,
): ToastMeta[] => {
  const rows: ToastMeta[] = [
    {
      label: "Files",
      value: `${files.length} · ${files.map(({ file }) => file.name).join(", ")}`,
    },
    {
      label: "Category",
      value: [metadata.major_head, metadata.minor_head].filter(Boolean).join(" · "),
    },
    {
      label: "Document date",
      value: metadata.documentDate,
    },
  ];

  if (metadata.tags.length > 0) {
    rows.push({ label: "Tags", value: metadata.tags.join(", ") });
  }

  return rows;
};

// Turns any upload failure into the reason, the fix and the request context.
const buildFailureToast = (error: unknown): Omit<ToastMessage, "id"> => {
  if (!(error instanceof UploadError)) {
    return {
      variant: "error",
      title: "Upload failed",
      message:
        error instanceof Error
          ? error.message
          : "Document upload failed. Please try again.",
    };
  }

  const meta: ToastMeta[] = [];

  if (error.uploaded !== undefined && error.total !== undefined) {
    meta.push({
      label: "Uploaded",
      value: `${error.uploaded} of ${error.total}`,
    });
  }

  if (error.fileName) {
    meta.push({ label: "File", value: error.fileName });
  }

  if (error.status) {
    meta.push({ label: "Status", value: `HTTP ${error.status}` });
  }

  return {
    variant: "error",
    title: error.uploaded ? "Upload stopped" : "Upload failed",
    message: error.reason,
    hint: error.hint,
    meta,
  };
};

export default function FileUploadSection({
  files,
  onFilesSelected,
  onRemoveFile,
  onClearFiles,
  onUpload,
}: FileUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [invalidFiles, setInvalidFiles] = useState<InvalidFile[]>([]);
  const [metadata, setMetadata] =
    useState<DocumentUploadMetadata>(INITIAL_METADATA);

  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // Bumped after a successful upload to remount the fields and clear their state.
  const [formKey, setFormKey] = useState(0);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    setToast({ id: crypto.randomUUID(), ...toast });
  }, []);

  const closeToast = useCallback((id: string) => {
    setToast((current) => (current?.id === id ? null : current));
  }, []);

  const processFiles = (fileList: FileList | File[]) => {
    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length === 0) return;

    const { validFiles, invalidFiles: rejectedFiles } =
      validateFiles(selectedFiles);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    if (rejectedFiles.length > 0) {
      setInvalidFiles(rejectedFiles);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    processFiles(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    processFiles(event.dataTransfer.files);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    // A new attempt clears the previous outcome.
    setToast(null);

    if (files.length === 0) {
      setSubmitError("Please select at least one valid file.");
      return;
    }

    if (
      !metadata.documentDate ||
      !metadata.major_head ||
      !metadata.minor_head ||
      metadata.tags.length === 0 ||
      !metadata.remarks.trim()
    ) {
      setSubmitError(
        "Please complete the document date, category, name or department, at least one tag, and remarks.",
      );
      return;
    }

    setIsUploading(true);

    try {
      await onUpload(files, {
        ...metadata,
        remarks: metadata.remarks.trim(),
      });

      // Only reset once the upload succeeded, so failures keep the input.
      setMetadata({ ...INITIAL_METADATA });
      setInvalidFiles([]);
      setFormKey((key) => key + 1);
      onClearFiles();

      showToast({
        variant: "success",
        title: "Upload complete",
        message: `${files.length} document${files.length === 1 ? "" : "s"} uploaded successfully.`,
        hint: "Open the Search documents tab to find and manage them.",
        meta: buildSuccessMeta(files, metadata),
      });
    } catch (error) {
      showToast(buildFailureToast(error));
    } finally {
      setIsUploading(false);
    }
  };

  const {
    data: existingTags = [],
    isLoading: isLoadingTags,
    isError: tagsError,
  } = useDocumentTags();

  return (
    <>
      <section
        id="upload"
        className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CloudUpload size={21} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Upload documents</h3>
              <p className="mt-1 text-xs text-slate-500">
                Select files and enter their document details.
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400">
            Multiple files supported
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_EXTENSIONS}
            className="hidden"
            onChange={handleInputChange}
          />

          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();

              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              ) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
            className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/30"
            }`}
          >
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
              <CloudUpload size={26} />
            </div>

            <h4 className="text-sm font-semibold text-slate-800">
              Drag and drop your files here
            </h4>

            <p className="mt-2 text-sm text-slate-500">
              Or browse multiple files from your device
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
            >
              <Plus size={17} />
              Browse files
            </button>

            <div className="mt-5 space-y-1">
              <p className="text-xs text-slate-500">
                Formats: {ACCEPTED_FILE_LABEL}
              </p>
              <p className="text-xs font-medium text-slate-500">
                Maximum size: {MAX_FILE_SIZE_LABEL} per file
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  Selected files ({files.length})
                </h4>

                <button
                  type="button"
                  onClick={onClearFiles}
                  disabled={isUploading}
                  className="text-xs font-medium text-slate-500 transition hover:text-red-600 disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                {files.map(({ id, file }) => {
                  const Icon = getFileIcon(file.name);

                  return (
                    <div
                      key={id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Icon size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <span className="hidden text-xs text-amber-600 sm:block">
                        Selected · Not uploaded
                      </span>

                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        disabled={isUploading}
                        onClick={() => onRemoveFile(id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DocumentMetadataFields
            key={formKey}
            value={metadata}
            onChange={setMetadata}
            existingTags={existingTags}
            isLoadingTags={isLoadingTags}
            tagsError={tagsError}
            disabled={isUploading}
          />

          {submitError && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {submitError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isUploading && (
                <LoaderCircle size={17} className="animate-spin" />
              )}
              {isUploading ? "Uploading..." : "Upload documents"}
            </button>
          </div>
        </form>
      </section>

      <FileValidationDialog
        files={invalidFiles}
        onClose={() => setInvalidFiles([])}
      />

      {toast && <Toast toast={toast} onClose={closeToast} />}
    </>
  );
}
