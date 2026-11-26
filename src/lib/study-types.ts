export const STUDY_SECTIONS = ['attendance', 'grades', 'internals', 'timetable'] as const;
export type StudySection = typeof STUDY_SECTIONS[number];

export type StudyRecord =
  | { kind: 'attendance'; code: string; name: string; component: string; attended: number; conducted: number }
  | { kind: 'grades'; code: string; name: string; grade: string; points: number | null; credits: number | null; term: string }
  | { kind: 'internals'; code: string; name: string; assessment: string; mark: string; outOf: string }
  | { kind: 'timetable'; code: string; name: string; day: string; time: string; room: string; faculty: string };

export type StudyResponse = { records: StudyRecord[]; semester?: string; academicYear?: string; message?: string };
