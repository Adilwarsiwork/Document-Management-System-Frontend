import {
  File,
  FileArchive,
  FileImage,
  FileText,
  FileType2,
} from "lucide-react";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(extension ?? "")) {
    return FileImage;
  }

  if (extension === "pdf") return FileText;

  if (["zip", "rar", "7z"].includes(extension ?? "")) {
    return FileArchive;
  }

  if (["doc", "docx", "txt", "rtf"].includes(extension ?? "")) {
    return FileType2;
  }

  return File;
}
