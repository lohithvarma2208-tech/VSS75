import { NextResponse } from 'next/server';
import { isR2Configured, getR2BucketName, getR2PublicDomain } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isR2Configured();
  return NextResponse.json({
    ok: true,
    service: 'Cloudflare R2 Object Storage',
    configured,
    bucket: configured ? getR2BucketName() : null,
    hasPublicDomain: Boolean(getR2PublicDomain()),
    timestamp: new Date().toISOString(),
  });
}
