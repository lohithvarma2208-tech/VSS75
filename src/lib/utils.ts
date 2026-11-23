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

export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch {
    return new Blob([dataUrl], { type: 'text/plain;charset=utf-8' });
  }
}

export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function triggerBrowserDownload(
  fileName: string,
  contentOrUrl?: string,
  mimeType?: string,
  fallbackContent?: string,
  extraMeta?: { title?: string; course?: string; description?: string; id?: string }
): Promise<boolean> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. Direct Blob URLs (e.g. from URL.createObjectURL of original uploaded file)
  if (contentOrUrl?.startsWith('blob:')) {
    try {
      const blobResp = await fetch(contentOrUrl);
      if (blobResp.ok) {
        const blob = await blobResp.blob();
        triggerBlobDownload(blob, fileName);
        return true;
      }
    } catch {
      // Blob expired/revoked across tab reloads, continue to persistent storage fetch
    }
  }

  // 1b. Direct Data URLs (Base64 binary)
  if (contentOrUrl?.startsWith('data:')) {
    const blob = dataUrlToBlob(contentOrUrl);
    triggerBlobDownload(blob, fileName);
    return true;
  }

  // 1c. Check client-side IndexedDB for the original uploaded binary
  try {
    const { getUploadedFile } = await import('@/lib/storage/file-storage');
    let stored = extraMeta?.id ? await getUploadedFile(extraMeta.id) : null;
    if (!stored) stored = await getUploadedFile(fileName);
    if (stored) {
      if (stored instanceof Blob) {
        triggerBlobDownload(stored, fileName);
        return true;
      }
      if (typeof stored === 'string' && stored.startsWith('data:')) {
        triggerBlobDownload(dataUrlToBlob(stored), fileName);
        return true;
      }
    }
  } catch {
    // Continue to remote storage fetch
  }

  // 2. Direct fetch from actual storage URL (Supabase, CDN, public/samples, R2, or relative path)
  const target = contentOrUrl || (ext === 'pdf' ? `/samples/${fileName}` : '');
  if (
    target &&
    (target.startsWith('/') ||
      target.startsWith('http://') ||
      target.startsWith('https://'))
  ) {
    try {
      const response = await fetch(target);
      if (response.ok) {
        const blob = await response.blob();
        triggerBlobDownload(blob, fileName);
        return true;
      }
    } catch (e) {
      console.warn('[VSS Download] Direct fetch from storage failed', e);
    }
  }

  // 2b. Attempt to fetch from /samples/${fileName} if not already attempted
  if (target !== `/samples/${fileName}`) {
    try {
      const sampleResp = await fetch(`/samples/${fileName}`);
      if (sampleResp.ok) {
        const blob = await sampleResp.blob();
        triggerBlobDownload(blob, fileName);
        return true;
      }
    } catch {
      // Continue
    }
  }

  // 2c. Check Cloudflare R2 bucket directly via /api/r2/download
  const r2Candidates = [
    `/api/r2/download?key=samples/${encodeURIComponent(fileName)}`,
    extraMeta?.id ? `/api/r2/download?key=resources/${encodeURIComponent(extraMeta.id)}/${encodeURIComponent(fileName)}` : '',
    `/api/r2/download?key=${encodeURIComponent(fileName)}`,
  ].filter(Boolean);

  for (const r2Candidate of r2Candidates) {
    try {
      const r2Resp = await fetch(r2Candidate);
      if (r2Resp.ok) {
        const blob = await r2Resp.blob();
        triggerBlobDownload(blob, fileName);
        return true;
      }
    } catch {
      // Continue
    }
  }

  // 3. For PDF files:
  // Strictly enforce: Do NOT summarize, rewrite, reconstruct, or regenerate an overview PDF.
  // If the original PDF cannot be retrieved, return false so the caller displays:
  // "Original PDF unavailable. Please try again later."
  if (ext === 'pdf') {
    return false;
  }

  // 4. For text/code files ONLY (py, java, c, cpp, txt, v), fallbackContent can be saved as raw source
  if (fallbackContent && ['py', 'java', 'c', 'cpp', 'txt', 'v', 'json'].includes(ext)) {
    const defaultMime =
      ext === 'java'
        ? 'text/x-java-source;charset=utf-8'
        : ext === 'py'
        ? 'text/x-python;charset=utf-8'
        : ext === 'v'
        ? 'text/x-verilog;charset=utf-8'
        : 'text/plain;charset=utf-8';
    const blob = new Blob([fallbackContent], { type: mimeType || defaultMime });
    triggerBlobDownload(blob, fileName);
    return true;
  }

  return false;
}
