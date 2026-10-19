import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import DashboardSidebar, {
  type DashboardSection,
} from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";
import FileUploadSection from "./components/FileUploadSection";
import DocumentSearchSection from "./components/DocumentSearchSection";

import { useSessionCountdown } from "./hooks/useSessionCountdown";

import type { SelectedDocument } from "./types/document.types";

import { uploadDocuments } from "./api/document-upload.api";
import { endAuthSession } from "../../services/auth-session";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<SelectedDocument[]>([]);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("upload");

  // The desktop and mobile headers are both mounted at once and only one is
  // visible at a time, so the clock is read here and handed to each of them
  // rather than run twice.
  const sessionSeconds = useSessionCountdown();

  const handleLogout = useCallback(() => {
    endAuthSession("logout");
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleFilesSelected = useCallback((incoming: File[]) => {
    setFiles((current) => {
      const additions = incoming
        .filter(
          (file) =>
            !current.some(
              (item) =>
                item.file.name === file.name &&
                item.file.size === file.size &&
                item.file.lastModified === file.lastModified,
            ),
        )
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
        }));

      return [...current, ...additions];
    });
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleClearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return (
    <div className="min-h-dvh bg-[#f7f8fc] text-slate-900 md:flex">
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
        sessionSeconds={sessionSeconds}
      />

      <div className="min-w-0 flex-1">
        <DashboardHeader sessionSeconds={sessionSeconds} />

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-7 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wider text-indigo-600">
                {activeSection === "search"
                  ? "YOUR DOCUMENTS"
                  : "DOCUMENT MANAGEMENT"}
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {activeSection === "search"
                  ? "Search Documents"
                  : "Upload Documents"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {activeSection === "search"
                  ? "Find and manage your selected documents."
                  : "Select and manage the documents you want to upload."}
              </p>
            </div>

            {activeSection === "search" && (
              <button
                type="button"
                onClick={() => setActiveSection("upload")}
                className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 sm:self-auto"
              >
                Upload documents
                <ArrowRight size={17} />
              </button>
            )}
          </section>

          {activeSection === "upload" && (
            <section id="upload">
              <FileUploadSection
                files={files}
                onFilesSelected={handleFilesSelected}
                onRemoveFile={handleRemoveFile}
                onClearFiles={handleClearFiles}
                onUpload={uploadDocuments}
              />
            </section>
          )}

          {activeSection === "search" && (
            <section id="documents">
              <DocumentSearchSection />
            </section>
          )}

          <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} DMS · Document Management System</p>
            <p>Document workspace</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
