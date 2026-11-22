import type { StudentCourse, UserProfile } from '@/types';
import { KLU_COURSES } from '@/lib/data/klu-courses';

export const ACADEMIC_CONTEXT_KEY = 'vss_academic_context_v1';
export const ACADEMIC_CONTEXT_EVENT = 'vss_academic_context_change';

export interface AcademicContext {
  semester: string;
  academicYear: string;
  source: 'erp' | 'manual' | 'catalog';
  userId?: string;
}

export const TERM_OPTIONS = [
  'Tri-Sem 1 (T1)', 'Tri-Sem 2 (T2)', 'Tri-Sem 3 (T3)', 'Tri-Sem 4 (T4)',
  'Tri-Sem 5 (T5)', 'Tri-Sem 6 (T6)', 'Tri-Sem 7 (T7)', 'Tri-Sem 8 (T8)',
  'Tri-Sem 9 (T9)', 'Tri-Sem 10 (T10)', 'Tri-Sem 11 (T11)', 'Tri-Sem 12 (T12)',
  'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8',
];

export function readAcademicContext(user?: UserProfile | null): AcademicContext {
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem(ACADEMIC_CONTEXT_KEY) || 'null') as AcademicContext | null;
      // Only a deliberate student override may outlive a fresh ERP sync.
      if (saved?.semester && saved.source === 'manual' && (!user?.id || saved.userId === user.id)) return saved;
    } catch { /* Ignore invalid local preferences. */ }
  }
  return {
    semester: user?.semester || '',
    academicYear: user?.academic_year || currentAcademicYear(),
    source: user?.academic_context_source || (user?.registered_courses?.length ? 'erp' : 'catalog'),
    userId: user?.id,
  };
}

export function saveAcademicContext(value: AcademicContext) {
  localStorage.setItem(ACADEMIC_CONTEXT_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(ACADEMIC_CONTEXT_EVENT, { detail: value }));
}

export function currentAcademicYear() {
  const now = new Date();
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

function sameTerm(left: string, right: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalize(left) === normalize(right) || normalize(left).startsWith(normalize(right)) || normalize(right).startsWith(normalize(left));
}

export function getRelevantCourses(user: UserProfile | null | undefined, semester: string): StudentCourse[] {
  if (!semester) return [];
  if (user?.registered_courses?.length) {
    const exact = user.registered_courses.filter((course) => {
      if (!course.semester) return sameTerm(user.semester, semester);
      return sameTerm(course.semester, semester);
    });
    const seen = new Set<string>();
    return exact.filter((course) => !seen.has(course.code) && seen.add(course.code));
  }

  // An authenticated student with no ERP registrations must see an empty state,
  // never a guessed department catalog containing unrelated courses.
  if (user) return [];

  let catalog = KLU_COURSES.filter((course) => sameTerm(course.semester, semester));
  if (!catalog.length) {
    const termNumber = semester.match(/\d+/)?.[0];
    if (termNumber) catalog = KLU_COURSES.filter((course) => course.semester.match(/\d+/)?.[0] === termNumber);
  }
  const seen = new Set<string>();
  return catalog.filter((course) => !seen.has(course.code) && seen.add(course.code)).map((course) => ({ code: course.code, name: course.name, semester: course.semester }));
}
