export interface CampusAcademicLeader {
  rank: number;
  code_name: string;
  username: string;
  full_name?: string;
  student_id?: string;
  academic_position: string;
  department: string;
  semester: string;
  weekly_posts: number;
  total_downloads: number;
  verified: boolean;
  avatar_seed: string;
  badge_color: string;
  specialization: string;
}

export const CAMPUS_ACADEMIC_HEADS: CampusAcademicLeader[] = [];

/**
 * Deterministically generates a unique, distinctive code name for any student.
 */
export function generateUserCodeName(username: string, studentId?: string): string {
  const prefixes = [
    'CYBER',
    'SHADOW',
    'NEURAL',
    'QUANTUM',
    'BINARY',
    'VECTOR',
    'ALGO',
    'TITAN',
    'KRYPTO',
    'APEX',
    'VORTEX',
    'COBALT',
    'ALPHA',
    'NEXUS',
  ];
  const suffixes = [
    'SCHOLAR',
    'PHANTOM',
    'COMMANDO',
    'ARCHON',
    'VALKYRIE',
    'VIPER',
    'SENTINEL',
    'WARLOCK',
    'ORACLE',
    'MARSHAL',
    'TITAN',
    'BLADE',
  ];

  let hash = 0;
  const str = (username || studentId || 'scholar').toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const prefix = prefixes[absHash % prefixes.length];
  const suffix = suffixes[(absHash >> 3) % suffixes.length];
  const num = (absHash % 89) + 10;
  return `${prefix}_${suffix}_${num}`;
}

/**
 * Deterministically assigns a Campus Academic Head position based on department & role.
 */
export function getUserAcademicPosition(user: { department?: string; role?: string; username?: string; code_name?: string }): string {
  if (user.role === 'admin') return 'Academic Affairs Administrator';

  const dept = (user.department || 'CSE').toUpperCase();
  if (dept.includes('AI') || dept.includes('DS')) return 'Academic Peer Lead · AI&DS';
  if (dept.includes('ECE')) return 'Academic Peer Lead · ECE';
  if (dept.includes('IT')) return 'Academic Peer Lead · CS&IT';
  return 'Academic Peer Lead · CSE';
}
