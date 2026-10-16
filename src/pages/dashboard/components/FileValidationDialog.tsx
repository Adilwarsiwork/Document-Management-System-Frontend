import { AlertTriangle, X } from "lucide-react";
import type { InvalidFile } from "../utils/file-validation.utils";

interface FileValidationDialogProps {
  files: InvalidFile[];
  onClose: () => void;
}

export default function FileValidationDialog({
  files,
  onClose,
}: FileValidationDialogProps) {
  if (files.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="file-error-title"
        aria-describedby="file-error-description"
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-red-100 bg-red-50/70 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="file-error-title"
              className="text-base font-semibold text-slate-900"
            >
              Some files could not be selected
            </h2>

            <p
              id="file-error-description"
              className="mt-1 text-sm leading-5 text-slate-600"
            >
              {files.length} invalid{" "}
              {files.length === 1 ? "file was" : "files were"} rejected. Remove
              these files from your selection and choose valid files.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close validation errors"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-100 hover:text-red-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[45vh] space-y-3 overflow-y-auto p-5">
          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-xl border border-red-100 bg-white p-3"
            >
              <p className="break-all text-sm font-semibold text-slate-800">
                {file.name}
              </p>
              <p className="mt-1 text-sm leading-5 text-red-600">
                {file.reason}
              </p>
            </div>
          ))}

          <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            Allowed formats: PDF and common image files. Maximum size: 10 MB per
            file.
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 p-4">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Got it
          </button>
        </div>
      </section>
    </div>
  );
}
