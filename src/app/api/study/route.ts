import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, getSignedInErpJar, SESSION_COOKIE } from '@/lib/erp/session';
import { readStudyRecords, StudyUnavailable } from '@/lib/erp/study';
import { STUDY_SECTIONS, type StudySection } from '@/lib/study-types';

export const runtime = 'nodejs';

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const profile = token ? await getErpSession(token).catch(() => null) : null;
  if (!token || !profile) return reply({ error: 'Sign in to view your ERP records.' }, 401);
  const section = STUDY_SECTIONS.find((item) => item === request.nextUrl.searchParams.get('section'));
  if (!section) return reply({ error: 'Choose a study section.' }, 400);

  const metadata = { semester: profile.semester, academicYear: profile.academicYear };
  try {
    const jar = await getSignedInErpJar(token);
    if (!jar) return reply({ ...metadata, records: [], message: 'Sign out and sign back in to connect Study to ERP.' });
    const records = await readStudyRecords(jar, profile, section satisfies StudySection);
    return reply({ ...metadata, records: records.slice(0, 500) });
  } catch (error) {
    if (error instanceof StudyUnavailable) return reply({ ...metadata, records: [], message: error.message });
    return reply({ error: 'Could not load records from ERP. Try again shortly.' }, 502);
  }
}
