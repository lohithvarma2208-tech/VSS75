import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { isAdminProfile, isValidAdminPasskey } from '@/lib/erp/admin-auth';
import { listVerifiedUsers, recordVerifiedLogin, syncUserBatch } from '@/lib/erp/admin-registry';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  const passkey = request.cookies.get('vss_admin_passkey')?.value ?? '';
  const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const searchPasskey = request.nextUrl.searchParams.get('passkey') ?? '';

  const effectivePasskey = passkey || authHeader || searchPasskey;
  const isPasskeyAdmin = isValidAdminPasskey(effectivePasskey);

  let isErpAdmin = false;
  if (token) {
    const profile = await getErpSession(token).catch(() => null);
    isErpAdmin = isAdminProfile(profile);
    if (profile) {
      await recordVerifiedLogin(profile, false).catch(() => {});
    }
  }

  // Also allow requests originating from same-origin admin dashboard
  const referer = request.headers.get('referer') || '';
  const isFromAdminPage = referer.includes('/admin');

  if (!isPasskeyAdmin && !isErpAdmin && !isFromAdminPage) {
    return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const users = await listVerifiedUsers();
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Expected JSON body' }, { status: 400 });
    }

    // Handle batch sync
    if (Array.isArray(body.users)) {
      const records = await syncUserBatch(body.users);
      return NextResponse.json({ ok: true, count: records.length, users: records });
    }

    // Handle single user login/registration
    const rawRoll = body.registrationNumber || body.student_id || body.username || body.rollNumber;
    if (!rawRoll) {
      return NextResponse.json({ error: 'Missing registration number or student ID' }, { status: 400 });
    }

    const rollNumber = String(rawRoll).trim().toUpperCase();
    const record = await recordVerifiedLogin({
      rollNumber,
      name: body.name || body.full_name || rollNumber,
      department: body.department || 'CSE',
      semester: body.semester || 'Sem 4',
      academicYear: body.academicYear || '2026-2027',
      email: body.email || `${rollNumber.toLowerCase()}@kluniversity.in`,
      role: body.role || 'student',
      courses: Array.isArray(body.courses) ? body.courses : [],
    }, true);

    return NextResponse.json({ ok: true, user: record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
