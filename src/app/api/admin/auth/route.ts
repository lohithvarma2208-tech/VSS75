import { NextRequest, NextResponse } from 'next/server';
import { OFFICIAL_ADMIN_REGISTRATION_NUMBERS } from '@/lib/erp/admin-auth';

export const runtime = 'nodejs';

const VALID_PASSKEYS = ['VSS75@ADMIN', 'DEEPTHANUSH@ADMIN', 'ADMIN-CORE-75'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { passkey, action } = body;

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Admin logged out' });
      response.cookies.set('vss_admin_passkey', '', {
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
      });
      return response;
    }

    // Check passkey
    const cleanKey = (passkey || '').trim();
    const envAdminIds = (process.env.ADMIN_REGISTRATION_NUMBERS || '')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => /^\d{6,20}$/.test(v));

    const allowedAdminIds = envAdminIds.length > 0 ? envAdminIds : Array.from(OFFICIAL_ADMIN_REGISTRATION_NUMBERS);

    const isMatch =
      VALID_PASSKEYS.includes(cleanKey) ||
      allowedAdminIds.includes(cleanKey);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid master administrator passkey. Access denied.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin authorization granted.',
      role: 'superadmin',
    });

    response.cookies.set('vss_admin_passkey', cleanKey, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      httpOnly: false, // accessible for quick status verify
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Admin authentication failed.' },
      { status: 500 }
    );
  }
}
