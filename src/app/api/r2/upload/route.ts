import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isR2Configured, uploadFileToR2, getPresignedUploadUrl } from '@/lib/r2';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xls', 'xlsx', 'zip', 'py', 'java', 'cpp', 'c', 'txt', 'png', 'jpg', 'jpeg']);

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._()-]/g, '_').slice(0, 180) || 'resource';
}

function validateFile(fileName: string, size: number) {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(extension)) return 'This file type is not supported.';
  if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) return 'Files must be between 1 byte and 50 MB.';
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value ?? '';
    const profile = token ? await getErpSession(token).catch(() => null) : null;
    if (!profile) return NextResponse.json({ ok: false, error: 'Sign in again before uploading.' }, { status: 401 });

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Cloudflare R2 is not configured on this environment.',
          configured: false,
        },
        { status: 503 }
      );
    }

    const contentType = req.headers.get('content-type') || '';

    // 1. JSON mode: Request a presigned direct upload URL (for direct client-to-R2 upload)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const fileName = body.fileName || 'file.pdf';
      const fileMime = body.contentType || 'application/pdf';
      const fileSize = Number(body.fileSize || 0);
      const validationError = validateFile(fileName, fileSize);
      if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

      const resourceId = String(body.resourceId || `res-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      const cleanFileName = safeFileName(fileName);
      const owner = profile.rollNumber.replace(/\D/g, '').slice(0, 20);
      const key = `resources/${owner}/${resourceId}-${randomUUID()}/${cleanFileName}`;

      const { uploadUrl, finalUrl } = await getPresignedUploadUrl(key, fileMime);

      return NextResponse.json({
        ok: true,
        mode: 'presigned',
        uploadUrl,
        finalUrl,
        key,
      });
    }

    // 2. Multipart form data mode: Direct serverless buffer upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const resourceId = (formData.get('resourceId') as string) || `res-${Date.now()}`;

      if (!file) {
        return NextResponse.json(
          { ok: false, error: 'No file attached to upload request.' },
          { status: 400 }
        );
      }

      const validationError = validateFile(file.name, file.size);
      if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanFileName = safeFileName(file.name);
      const owner = profile.rollNumber.replace(/\D/g, '').slice(0, 20);
      const safeResourceId = resourceId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      const key = `resources/${owner}/${safeResourceId}-${randomUUID()}/${cleanFileName}`;
      const fileMime = file.type || 'application/octet-stream';

      const result = await uploadFileToR2(buffer, key, fileMime);

      return NextResponse.json({
        ok: true,
        mode: 'direct',
        url: result.url,
        key: result.key,
        size: result.size,
        fileName: file.name,
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Unsupported Content-Type. Expected multipart/form-data or application/json.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Cloudflare R2 Upload Error]', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to upload to Cloudflare R2.' },
      { status: 500 }
    );
  }
}
