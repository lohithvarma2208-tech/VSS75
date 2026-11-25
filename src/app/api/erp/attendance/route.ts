import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { getStudentAttendanceSummary } from '@/lib/erp/academic-schedule';
import { StudentCourse } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
    const searchStudentId = request.nextUrl.searchParams.get('studentId') || '';
    const headerStudentId = request.headers.get('x-vss-student-id') || '';

    let studentId = searchStudentId || headerStudentId;
    let studentName = studentId;
    let department = 'Computer Science & Engineering';
    let semester = 'Tri-Sem 2';
    let academicYear = '2026-27';
    let courses: StudentCourse[] = [];

    if (token) {
      const erpProfile = await getErpSession(token).catch(() => null);
      if (erpProfile) {
        studentId = erpProfile.rollNumber;
        studentName = erpProfile.name;
        department = erpProfile.department || department;
        semester = erpProfile.semester || semester;
        academicYear = erpProfile.academicYear || academicYear;
        courses = erpProfile.courses || [];
      }
    }

    if (!studentId) {
      // Default fallback demo student for unauthenticated preview
      studentId = '2600080191';
      studentName = 'SHAIK ABDUL RAHMAN';
      department = 'Department of Artificial Intelligence and Data Science';
    }

    const attendanceSummary = getStudentAttendanceSummary(studentId, studentName, courses, {
      department,
      semester,
      academicYear,
    });

    return NextResponse.json(
      { ok: true, attendance: attendanceSummary },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not fetch attendance summary.' },
      { status: 500 }
    );
  }
}
