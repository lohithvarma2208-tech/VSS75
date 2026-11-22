import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch {
    return dateString;
  }
}

export function triggerBrowserDownload(fileName: string, contentOrUrl: string, mimeType?: string) {
  if (!contentOrUrl) return;

  // 1. Direct Data URLs (Base64 binary files like PDFs, DOCX, ZIP) or Blob URLs
  if (contentOrUrl.startsWith('data:') || contentOrUrl.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = contentOrUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. Relative sample files in public/ or absolute URLs
  if (
    contentOrUrl.startsWith('/samples/') ||
    contentOrUrl.startsWith('http://') ||
    contentOrUrl.startsWith('https://')
  ) {
    const a = document.createElement('a');
    a.href = contentOrUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 3. Fallback for text / code content strings
  const ext = fileName.split('.').pop()?.toLowerCase();
  let defaultMime = 'text/plain';
  if (ext === 'pdf') defaultMime = 'application/pdf';
  else if (ext === 'docx') defaultMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (ext === 'pptx') defaultMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  else if (ext === 'zip') defaultMime = 'application/zip';

  const blob = new Blob([contentOrUrl], { type: mimeType || defaultMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
