import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { isAdminProfile } from '@/lib/erp/admin-auth';
import { listVerifiedUsers, recordVerifiedLogin } from '@/lib/erp/admin-registry';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  const profile = token ? await getErpSession(token).catch(() => null) : null;
  if (!profile) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!isAdminProfile(profile)) return NextResponse.json({ error: 'Admin access denied.' }, { status: 403 });
  try {
    await recordVerifiedLogin(profile, false);
    const users = await listVerifiedUsers();
    return NextResponse.json({ users }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Could not load the private user registry.' }, { status: 503 });
  }
}
