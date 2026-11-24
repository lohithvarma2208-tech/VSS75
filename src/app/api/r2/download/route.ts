import { NextRequest, NextResponse } from 'next/server';
import { isR2Configured, getFileFromR2, getPresignedDownloadUrl } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const proxyMode = searchParams.get('proxy') === 'true';
    const disposition = searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment';

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

    const cleanKey = key.replace(/^\/+/, '');
    if ((!cleanKey.startsWith('resources/') && !cleanKey.startsWith('samples/')) || cleanKey.includes('..')) {
      return NextResponse.json({ ok: false, error: 'Invalid file key.' }, { status: 400 });
    }
    const fileName = cleanKey.split('/').pop() || 'downloaded_file.pdf';

    // Browser-native delivery is the reliable path on mobile Safari and avoids
    // buffering entire PDFs in application memory. Proxying remains available
    // for compatibility checks only.
    if (!proxyMode) {
      const presignedUrl = await getPresignedDownloadUrl(cleanKey, fileName, 300, disposition);
      return NextResponse.redirect(presignedUrl, 307);
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
      `${disposition}; filename="${fileName.replace(/[\r\n"\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
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
