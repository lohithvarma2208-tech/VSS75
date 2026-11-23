import { NextRequest, NextResponse } from 'next/server';
import { isR2Configured, getFileFromR2, getPresignedDownloadUrl } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const redirectMode = searchParams.get('redirect') === 'true';

    if (!key) {
      return NextResponse.json(
        { ok: false, error: 'Missing required file key parameter.' },
        { status: 400 }
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { ok: false, error: 'Cloudflare R2 storage is not configured.' },
        { status: 503 }
      );
    }

    const cleanKey = decodeURIComponent(key).replace(/^\/+/, '');
    const fileName = cleanKey.split('/').pop() || 'downloaded_file.pdf';

    // If client requested a direct redirect to a presigned URL
    if (redirectMode) {
      const presignedUrl = await getPresignedDownloadUrl(cleanKey, fileName);
      return NextResponse.redirect(presignedUrl);
    }

    // Direct binary stream from R2
    const r2Response = await getFileFromR2(cleanKey);

    if (!r2Response.Body) {
      return NextResponse.json(
        { ok: false, error: 'Original PDF unavailable. Please try again later.' },
        { status: 404 }
      );
    }

    // Convert AWS SDK Stream to Web ReadableStream
    const stream = r2Response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set('Content-Type', r2Response.ContentType || 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    if (r2Response.ContentLength) {
      headers.set('Content-Length', r2Response.ContentLength.toString());
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(stream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[Cloudflare R2 Download Error]', error);
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json(
        { ok: false, error: 'Original PDF unavailable. Please try again later.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { ok: false, error: 'Original PDF unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}
