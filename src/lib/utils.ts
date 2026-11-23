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

export async function triggerBrowserDownload(
  fileName: string,
  contentOrUrl?: string,
  mimeType?: string,
  fallbackContent?: string
) {
  if (!contentOrUrl && !fallbackContent) return;

  const target = contentOrUrl || fallbackContent || '';

  // 1. Direct Data URLs (Base64 binary files like PDFs, DOCX, ZIP) or Blob URLs
  if (target.startsWith('data:') || target.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = target;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. Relative sample files in public/ or absolute URLs
  if (
    target.startsWith('/') ||
    target.startsWith('http://') ||
    target.startsWith('https://')
  ) {
    try {
      const response = await fetch(target);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      }
    } catch (e) {
      console.warn('[VSS Download] Direct fetch failed, trying local generation fallback', e);
    }
  }

  // 3. Fallback for text / code / PDF content generation
  const textContent = fallbackContent || target;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      // Header Banner
      page.drawRectangle({
        x: 0,
        y: height - 60,
        width,
        height: 60,
        color: rgb(0.06, 0.08, 0.16),
      });

      page.drawText('KL UNIVERSITY · VIRTUAL STUDENT SPACE ARCHIVE', {
        x: 40,
        y: height - 36,
        size: 11,
        font: fontBold,
        color: rgb(0.65, 0.75, 1.0),
      });

      page.drawText(fileName.slice(0, 60), {
        x: 40,
        y: height - 95,
        size: 14,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.15),
      });

      page.drawLine({
        start: { x: 40, y: height - 105 },
        end: { x: width - 40, y: height - 105 },
        thickness: 1,
        color: rgb(0.7, 0.75, 0.85),
      });

      const lines = textContent.split('\n');
      let currentY = height - 130;
      for (const line of lines.slice(0, 45)) {
        if (currentY < 50) break;
        const clean = line.trim();
        if (!clean) {
          currentY -= 6;
          continue;
        }
        const isHeading = clean.startsWith('STAGE') || clean.startsWith('PHASE') || clean.startsWith('UNIT') || clean.startsWith('COURSE');
        page.drawText(clean.slice(0, 85), {
          x: 40,
          y: currentY,
          size: isHeading ? 10 : 9,
          font: isHeading ? fontBold : font,
          color: isHeading ? rgb(0.2, 0.1, 0.5) : rgb(0.2, 0.22, 0.28),
        });
        currentY -= 15;
      }

      page.drawText('Verified Student Resource · Virtual Student Space · https://klu-vss.vercel.app', {
        x: 40,
        y: 25,
        size: 8,
        font,
        color: rgb(0.5, 0.55, 0.65),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return;
    } catch (e) {
      console.warn('[VSS Download] In-memory PDF synthesis failed, falling back to raw blob', e);
    }
  }

  let defaultMime = 'text/plain;charset=utf-8';
  if (ext === 'pdf') defaultMime = 'application/pdf';
  else if (ext === 'docx') defaultMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (ext === 'pptx') defaultMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  else if (ext === 'zip') defaultMime = 'application/zip';
  else if (ext === 'java') defaultMime = 'text/x-java-source;charset=utf-8';
  else if (ext === 'py') defaultMime = 'text/x-python;charset=utf-8';
  else if (ext === 'v') defaultMime = 'text/x-verilog;charset=utf-8';

  const blob = new Blob([textContent], { type: mimeType || defaultMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
