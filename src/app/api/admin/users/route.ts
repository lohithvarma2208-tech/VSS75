import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { isAdminProfile } from '@/lib/erp/admin-auth';
import { listVerifiedUsers, recordVerifiedLogin } from '@/lib/erp/admin-registry';

export const runtime = 'nodejs';

const VALID_PASSKEYS = ['VSS75@ADMIN', 'DEEPTHANUSH@ADMIN', 'ADMIN-CORE-75'];

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  const passkey = request.cookies.get('vss_admin_passkey')?.value ?? '';
  const profile = token ? await getErpSession(token).catch(() => null) : null;

  const isPasskeyAdmin = VALID_PASSKEYS.includes(passkey);
  const isErpAdmin = isAdminProfile(profile);

  if (!isPasskeyAdmin && !profile) {
    return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
  }

  if (!isPasskeyAdmin && !isErpAdmin) {
    return NextResponse.json({ error: 'Admin access denied.' }, { status: 403 });
  }

  try {
    if (profile) {
      await recordVerifiedLogin(profile, false).catch(() => {});
    }
    const users = await listVerifiedUsers().catch(() => []);
    return NextResponse.json({ users }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return NextResponse.json({ users: [] }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}
