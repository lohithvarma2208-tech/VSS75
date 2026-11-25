import {
  CourseAttendance,
  StudentAttendanceSummary,
  StudentCourse,
  StudentTimetable,
  TimetableDay,
  TimetableSlot,
} from '@/types';

// Deterministic seed helper so attendance and schedule are stable per student roll number
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

const KLU_ROOMS = [
  'C-402 (CSE Dept)',
  'C-415 (Smart Classroom)',
  'C-521 (Lecture Hall)',
  'R-104 (Research Block)',
  'R-202 (Audi 2)',
  'CSE Lab 4 (IoT & Systems)',
  'AI & DS Lab 2 (GPU Workstation)',
  'ECE Lab 1 (Digital Electronics)',
  'L-Block 301 (Language Lab)',
  'M-204 (Mechanical Block)',
];

const KLU_FACULTY_POOL = [
  'Dr. P. Venkata Krishna',
  'Dr. V. Rajesh',
  'Dr. K. Radhika',
  'Dr. B. Thirumala Rao',
  'Dr. S. Balaji',
  'Dr. A. Srinivas',
  'Dr. M. Sangeetha',
  'Dr. Ch. Pradeep',
  'Dr. K. V. D. Kiran',
  'Prof. T. Sudheer Kumar',
  'Dr. N. Srikanth',
];

const STANDARD_PERIODS = [
  { start: '09:00 AM', end: '10:00 AM', label: 'Period 1' },
  { start: '10:00 AM', end: '11:00 AM', label: 'Period 2' },
  { start: '11:15 AM', end: '12:15 PM', label: 'Period 3' },
  { start: '12:15 PM', end: '01:15 PM', label: 'Period 4' },
  { start: '02:00 PM', end: '03:00 PM', label: 'Period 5' },
  { start: '03:00 PM', end: '04:00 PM', label: 'Period 6' },
  { start: '04:00 PM', end: '05:00 PM', label: 'Period 7' },
];

const DAYS_OF_WEEK: TimetableDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculates safe bunks and needed classes based on KLU regulations:
 * - 75% minimum attendance required for semester-end exam hall ticket
 * - 85% recommended attendance for distinction, honors, and campus placement eligibility
 */
export function calculateAttendanceMetrics(
  conducted: number,
  attended: number,
  code: string,
  name: string,
  extra?: { ltps?: string; faculty?: string; room?: string; category?: string }
): CourseAttendance {
  const safeConducted = Math.max(1, conducted);
  const safeAttended = Math.min(safeConducted, Math.max(0, attended));
  const percentage = Number(((safeAttended / safeConducted) * 100).toFixed(2));

  // Safe bunks: floor((attended - 0.75 * conducted) / 0.75)
  const safeBunks75 = percentage >= 75 ? Math.max(0, Math.floor((safeAttended - 0.75 * safeConducted) / 0.75)) : 0;
  const safeBunks85 = percentage >= 85 ? Math.max(0, Math.floor((safeAttended - 0.85 * safeConducted) / 0.85)) : 0;

  // Needed to attend: ceil((req * conducted - attended) / (1 - req))
  const neededToAttend75 = percentage < 75 ? Math.max(0, Math.ceil((0.75 * safeConducted - safeAttended) / 0.25)) : 0;
  const neededToAttend85 = percentage < 85 ? Math.max(0, Math.ceil((0.85 * safeConducted - safeAttended) / 0.15)) : 0;

  return {
    courseCode: code,
    courseName: name,
    category: extra?.category || 'Professional Core',
    ltps: extra?.ltps || '3-0-2-0',
    conducted: safeConducted,
    attended: safeAttended,
    percentage,
    safeBunks75,
    safeBunks85,
    neededToAttend75,
    neededToAttend85,
    faculty: extra?.faculty,
    room: extra?.room,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generates or extracts deterministic attendance data for a student's enrolled courses.
 */
export function getStudentAttendanceSummary(
  studentId: string,
  studentName: string,
  courses: StudentCourse[],
  metadata?: { department?: string; semester?: string; academicYear?: string }
): StudentAttendanceSummary {
  const cleanId = studentId.trim().toUpperCase() || 'STUDENT';
  const courseList = courses && courses.length > 0 ? courses : getFallbackCourses(cleanId);

  const courseAttendances: CourseAttendance[] = courseList.map((course, index) => {
    // If the course already has live ERP attendance attached, preserve it
    if (course.attendance && course.attendance.conducted > 0) {
      return course.attendance;
    }

    const seed = hashSeed(`${cleanId}-${course.code}`);
    // Realistic conducted count: 36 to 52 classes
    const conducted = 36 + (seed % 17);

    // Realistic attendance percentage (between 76% and 94%, with an occasional 72% edge case for testing the calculator)
    const basePct = 76 + ((seed >> 2) % 19);
    const attended = Math.min(conducted, Math.round((basePct / 100) * conducted));

    const faculty = KLU_FACULTY_POOL[(seed + index) % KLU_FACULTY_POOL.length];
    const room = KLU_ROOMS[(seed + index) % KLU_ROOMS.length];

    return calculateAttendanceMetrics(conducted, attended, course.code, course.name, {
      faculty,
      room,
      category: course.code.startsWith('26UC') ? 'Skill Course' : 'Core Engineering',
    });
  });

  const totalConducted = courseAttendances.reduce((acc, c) => acc + c.conducted, 0);
  const totalAttended = courseAttendances.reduce((acc, c) => acc + c.attended, 0);
  const overallPercentage = totalConducted > 0 ? Number(((totalAttended / totalConducted) * 100).toFixed(2)) : 100;

  return {
    studentId: cleanId,
    name: studentName || cleanId,
    department: metadata?.department || 'Computer Science & Engineering',
    semester: metadata?.semester || 'Tri-Sem 2',
    academicYear: metadata?.academicYear || '2026-27',
    overallPercentage,
    totalConducted,
    totalAttended,
    isEligibleForExams: overallPercentage >= 75,
    isEligibleForHonors: overallPercentage >= 85,
    courses: courseAttendances,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Builds a deterministic, structured weekly timetable (Monday - Saturday) for a student.
 */
export function getStudentTimetable(
  studentId: string,
  courses: StudentCourse[],
  metadata?: { semester?: string; section?: string }
): StudentTimetable {
  const cleanId = studentId.trim().toUpperCase() || 'STUDENT';
  const courseList = courses && courses.length > 0 ? courses : getFallbackCourses(cleanId);
  const slots: TimetableSlot[] = [];

  const baseSeed = hashSeed(cleanId);
  let slotCounter = 1;

  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    // 4 to 6 periods per day
    const periodsToday = 4 + ((baseSeed + dayIndex) % 3);

    for (let pIdx = 0; pIdx < periodsToday; pIdx++) {
      const period = STANDARD_PERIODS[pIdx];
      const courseIndex = (baseSeed + dayIndex * 2 + pIdx) % courseList.length;
      const course = courseList[courseIndex];

      const slotSeed = hashSeed(`${cleanId}-${day}-${pIdx}`);
      const isLab = pIdx >= 4 && slotSeed % 3 === 0;
      const isTutorial = slotSeed % 5 === 0;

      const type: TimetableSlot['type'] = isLab ? 'Lab' : isTutorial ? 'Tutorial' : 'Lecture';
      const room = isLab
        ? KLU_ROOMS.find((r) => r.includes('Lab')) || 'CSE Lab 4 (IoT & Systems)'
        : KLU_ROOMS[(slotSeed) % KLU_ROOMS.length];
      const faculty = KLU_FACULTY_POOL[(slotSeed) % KLU_FACULTY_POOL.length];

      slots.push({
        id: `slot-${slotCounter++}`,
        day,
        startTime: period.start,
        endTime: period.end,
        courseCode: course.code,
        courseName: course.name,
        room,
        type,
        faculty,
      });
    }
  });

  return {
    studentId: cleanId,
    semester: metadata?.semester || 'Tri-Sem 2',
    section: metadata?.section || `S-${10 + (baseSeed % 15)}`,
    slots,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns fallback official KLU courses when a user profile has no course array yet
 */
export function getFallbackCourses(studentId: string): StudentCourse[] {
  const isY26 = studentId.startsWith('26');
  if (isY26) {
    return [
      { code: '26SC1203', name: 'DATA STRUCTURES AND ALGORITHMS – 1', semester: 'Tri-Sem 2 (T2)' },
      { code: '26MT1202', name: 'MATHEMATICS FOR AI', semester: 'Tri-Sem 2 (T2)' },
      { code: '26EC1202', name: 'DIGITAL DESIGN & COMPUTER ARCHITECTURE', semester: 'Tri-Sem 2 (T2)' },
      { code: '26UC1204', name: 'COMMUNICATION SKILLS FOR ENGINEERS', semester: 'Tri-Sem 2 (T2)' },
      { code: '26FL1002', name: 'JAPANESE LANGUAGE PROFICIENCY', semester: 'Tri-Sem 2 (T2)' },
      { code: '26UC1137', name: 'DESIGN THINKING FOR INNOVATION & ENTREPRENEURSHIP', semester: 'Tri-Sem 2 (T2)' },
    ];
  }
  return [
    { code: '23CS2101', name: 'Data Structures and Algorithms', semester: 'Sem 3' },
    { code: '23CS3106', name: 'Database Management Systems', semester: 'Sem 4' },
    { code: '23CS3309', name: 'Computer Networks & Security', semester: 'Sem 4' },
    { code: '23MT2001', name: 'Discrete Mathematics & Logic', semester: 'Sem 3' },
    { code: '23CS2202', name: 'Operating Systems & Concurrency', semester: 'Sem 4' },
  ];
}

/**
 * Calculates current active slot and next class based on real-time clock
 */
export function getLiveScheduleStatus(slots: TimetableSlot[], now = new Date()): {
  currentSlot: TimetableSlot | null;
  nextSlot: TimetableSlot | null;
  todayDay: TimetableDay;
  todaySlots: TimetableSlot[];
} {
  const dayNames: TimetableDay[] = ['Sunday' as TimetableDay, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = dayNames[now.getDay()] || 'Monday';
  const todaySlots = slots.filter((s) => s.day === todayDay);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  function timeToMinutes(timeStr: string): number {
    const [time, period] = timeStr.split(' ');
    const [h, m] = time.split(':').map(Number);
    let hours = h % 12;
    if (period === 'PM') hours += 12;
    return hours * 60 + m;
  }

  let currentSlot: TimetableSlot | null = null;
  let nextSlot: TimetableSlot | null = null;

  for (const slot of todaySlots) {
    const startM = timeToMinutes(slot.startTime);
    const endM = timeToMinutes(slot.endTime);

    if (currentMinutes >= startM && currentMinutes < endM) {
      currentSlot = { ...slot, isCurrent: true };
    } else if (currentMinutes < startM && !nextSlot) {
      nextSlot = slot;
    }
  }

  return {
    currentSlot,
    nextSlot,
    todayDay,
    todaySlots,
  };
}
