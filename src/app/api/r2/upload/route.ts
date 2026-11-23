import { NextRequest, NextResponse } from 'next/server';
import { isR2Configured, uploadFileToR2, getPresignedUploadUrl } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
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
      const resourceId = body.resourceId || `res-${Date.now()}`;
      
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `resources/${resourceId}/${cleanFileName}`;

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

      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `resources/${resourceId}/${cleanFileName}`;
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
