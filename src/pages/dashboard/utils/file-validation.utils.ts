export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const MAX_FILE_SIZE_LABEL = "10 MB";

const ALLOWED_FILE_TYPES: Record<string, readonly string[]> = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".bmp": ["image/bmp", "image/x-ms-bmp"],
  ".avif": ["image/avif"],
  ".tif": ["image/tiff"],
  ".tiff": ["image/tiff"],
};

export const ACCEPTED_FILE_EXTENSIONS =
  Object.keys(ALLOWED_FILE_TYPES).join(",");

export const ACCEPTED_FILE_LABEL =
  "PDF, JPG, JPEG, PNG, GIF, WebP, BMP, AVIF, TIF and TIFF";

export interface InvalidFile {
  id: string;
  name: string;
  reason: string;
}

export interface FileValidationResult {
  validFiles: File[];
  invalidFiles: InvalidFile[];
}

function getExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0) return "";

  return fileName.slice(lastDotIndex).toLowerCase();
}

export function formatMaximumFileSize(): string {
  return MAX_FILE_SIZE_LABEL;
}

export function validateFiles(files: File[]): FileValidationResult {
  const validFiles: File[] = [];
  const invalidFiles: InvalidFile[] = [];

  files.forEach((file, index) => {
    let reason: string | null = null;

    const extension = getExtension(file.name);
    const allowedMimeTypes = ALLOWED_FILE_TYPES[extension];

    if (!file.name.trim() || !allowedMimeTypes) {
      reason =
        "Unsupported format. Only PDF and common image formats are allowed.";
    } else if (file.size === 0) {
      reason = "The file is empty.";
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      reason = `File exceeds the ${MAX_FILE_SIZE_LABEL} size limit.`;
    } else if (
      file.type &&
      !allowedMimeTypes.includes(file.type.toLowerCase())
    ) {
      reason = "The file extension and file type do not match.";
    }

    if (reason) {
      invalidFiles.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        name: file.name || "Unnamed file",
        reason,
      });
    } else {
      validFiles.push(file);
    }
  });

  return { validFiles, invalidFiles };
}
