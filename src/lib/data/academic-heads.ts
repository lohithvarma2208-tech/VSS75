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

export const CAMPUS_ACADEMIC_HEADS: CampusAcademicLeader[] = [
  {
    rank: 1,
    code_name: 'SHADOW_SCHOLAR_01',
    username: 'shadow_scholar_01',
    full_name: 'ShadowScholar_01',
    academic_position: '👑 Supreme Academic Chancellor',
    department: 'CSE',
    semester: 'Sem 4',
    weekly_posts: 8,
    total_downloads: 1420,
    verified: true,
    avatar_seed: 'shadow_scholar_01',
    badge_color: 'amber',
    specialization: 'Advanced Algorithms & Graph Theory',
  },
  {
    rank: 2,
    code_name: 'DATA_VALKYRIE_09',
    username: 'data_valkyrie_09',
    full_name: 'DataValkyrie_09',
    academic_position: '🧠 Head of AI&DS Academic Affairs',
    department: 'AI&DS',
    semester: 'Sem 3',
    weekly_posts: 6,
    total_downloads: 980,
    verified: true,
    avatar_seed: 'data_valkyrie_09',
    badge_color: 'purple',
    specialization: 'Deep Learning & Neural Networks',
  },
  {
    rank: 3,
    code_name: 'CIRCUIT_TITAN_77',
    username: 'circuit_titan_77',
    full_name: 'CircuitTitan_77',
    academic_position: '⚡ Head of ECE Academic Affairs',
    department: 'ECE',
    semester: 'Sem 5',
    weekly_posts: 5,
    total_downloads: 740,
    verified: true,
    avatar_seed: 'circuit_titan_77',
    badge_color: 'cyan',
    specialization: 'VLSI Architectures & Signals',
  },
  {
    rank: 4,
    code_name: 'ALGO_PHANTOM_42',
    username: 'algo_phantom_42',
    full_name: 'AlgoPhantom_42',
    academic_position: '🛡️ Chief Quality & Pioneer Marshal',
    department: 'CS&IT',
    semester: 'Sem 6',
    weekly_posts: 5,
    total_downloads: 620,
    verified: true,
    avatar_seed: 'algo_phantom_42',
    badge_color: 'indigo',
    specialization: 'Cloud Security & Distributed Systems',
  },
  {
    rank: 5,
    code_name: 'QUANTUM_ARCHON_18',
    username: 'quantum_archon_18',
    full_name: 'QuantumArchon_18',
    academic_position: '📜 University Academic Secretary',
    department: 'CSE',
    semester: 'Sem 4',
    weekly_posts: 5,
    total_downloads: 580,
    verified: true,
    avatar_seed: 'quantum_archon_18',
    badge_color: 'pink',
    specialization: 'Database Systems & SQL Optimization',
  },
  {
    rank: 6,
    code_name: 'NEURAL_VIPER_X',
    username: 'neural_viper_x',
    full_name: 'NeuralViper_X',
    academic_position: '🔬 Lead Lab Operations Marshal',
    department: 'AI&DS',
    semester: 'Sem 6',
    weekly_posts: 4,
    total_downloads: 510,
    verified: true,
    avatar_seed: 'neural_viper_x',
    badge_color: 'rose',
    specialization: 'Computer Vision & Model Deployment',
  },
];

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
  if (user.role === 'admin' || user.username === 'provost_zero') return 'Chief Academic Marshal & Provost';
  if (user.username === 'shadow_scholar_01' || user.code_name === 'SHADOW_SCHOLAR_01') {
    return '👑 Supreme Academic Chancellor';
  }
  if (user.username === 'data_valkyrie_09' || user.code_name === 'DATA_VALKYRIE_09') {
    return '🧠 Head of AI&DS Academic Affairs';
  }
  if (user.username === 'circuit_titan_77' || user.code_name === 'CIRCUIT_TITAN_77') {
    return '⚡ Head of ECE Academic Affairs';
  }
  if (user.username === 'neural_viper_x' || user.code_name === 'NEURAL_VIPER_X') {
    return '🔬 Lead Lab Operations Marshal';
  }

  const dept = (user.department || 'CSE').toUpperCase();
  if (dept.includes('AI') || dept.includes('DS')) return '🧠 Head of AI&DS Academic Affairs';
  if (dept.includes('ECE')) return '⚡ Head of ECE Academic Affairs';
  if (dept.includes('IT')) return '🛡️ Head of CS&IT Academic Affairs';
  return '⚡ Head of CSE Academic Affairs';
}
