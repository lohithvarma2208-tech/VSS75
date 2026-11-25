import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { getStudentTimetable, getLiveScheduleStatus } from '@/lib/erp/academic-schedule';
import { StudentCourse } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
    const searchStudentId = request.nextUrl.searchParams.get('studentId') || '';
    const headerStudentId = request.headers.get('x-vss-student-id') || '';

    let studentId = searchStudentId || headerStudentId;
    let semester = 'Tri-Sem 2';
    let courses: StudentCourse[] = [];

    if (token) {
      const erpProfile = await getErpSession(token).catch(() => null);
      if (erpProfile) {
        studentId = erpProfile.rollNumber;
        semester = erpProfile.semester || semester;
        courses = erpProfile.courses || [];
      }
    }

    if (!studentId) {
      studentId = '2600080191';
    }

    const timetable = getStudentTimetable(studentId, courses, { semester });
    const liveStatus = getLiveScheduleStatus(timetable.slots);

    return NextResponse.json(
      { ok: true, timetable, liveStatus },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not fetch timetable.' },
      { status: 500 }
    );
  }
}
