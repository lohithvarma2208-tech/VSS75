import { z } from 'zod';
import type { ErpProfile } from './client';
import { OFFICIAL_ADMIN_REGISTRATION_NUMBERS } from './admin-auth';
import { getFileFromR2, isR2Configured, uploadFileToR2 } from '@/lib/r2';

export const recordSchema = z.object({
  registrationNumber: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  department: z.string().max(200),
  semester: z.string().max(80).optional(),
  academicYear: z.string().max(40).optional(),
  courses: z.array(z.object({ code: z.string(), name: z.string(), semester: z.string().optional() })).max(100).default([]),
  firstLoginAt: z.string(),
  lastLoginAt: z.string(),
  loginCount: z.number().int().positive(),
  consentVersion: z.string().max(40).optional(),
  consentedAt: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
});

export type AdminUserRecord = z.infer<typeof recordSchema>;

export interface UserLoginInput {
  rollNumber: string;
  name: string;
  department?: string;
  semester?: string;
  academicYear?: string;
  courses?: { code: string; name: string; semester?: string }[];
  email?: string;
  role?: string;
}

// In-memory cache across server requests
const inMemoryUsers = new Map<string, AdminUserRecord>();

async function readJsonFromR2<T>(key: string): Promise<T | null> {
  try {
    const res = await getFileFromR2(key);
    if (!res || !res.Body) return null;
    let text = '';
    if (typeof (res.Body as any).transformToString === 'function') {
      text = await (res.Body as any).transformToString('utf-8');
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of res.Body as any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      text = Buffer.concat(chunks).toString('utf-8');
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeJsonToR2(key: string, data: unknown): Promise<void> {
  const jsonBuf = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
  await uploadFileToR2(jsonBuf, key, 'application/json');
}

export async function recordVerifiedLogin(
  profile: ErpProfile | UserLoginInput,
  incrementLogin = true,
  acceptedTerms = false
): Promise<AdminUserRecord> {
  const cleanRoll = String(profile.rollNumber || '').trim().toUpperCase();
  if (!cleanRoll) throw new Error('Missing registration number');

  const now = new Date().toISOString();
  let existing = inMemoryUsers.get(cleanRoll) || null;

  if (!existing && isR2Configured()) {
    existing = await readJsonFromR2<AdminUserRecord>(`registry/users/${cleanRoll}.json`);
  }

  const record: AdminUserRecord = {
    registrationNumber: cleanRoll,
    name: profile.name || cleanRoll,
    department: profile.department || existing?.department || 'CSE',
    semester: profile.semester || existing?.semester || 'Sem 4',
    academicYear: profile.academicYear || existing?.academicYear || '2026-2027',
    courses: profile.courses || existing?.courses || [],
    firstLoginAt: existing?.firstLoginAt || now,
    lastLoginAt: now,
    loginCount: existing ? existing.loginCount + (incrementLogin ? 1 : 0) : 1,
    consentVersion: acceptedTerms ? 'erp-login-v1' : existing?.consentVersion,
    consentedAt: acceptedTerms ? now : existing?.consentedAt,
    email: (profile as any).email || existing?.email || `${cleanRoll.toLowerCase()}@kluniversity.in`,
    role: OFFICIAL_ADMIN_REGISTRATION_NUMBERS.includes(cleanRoll as any) ? 'admin' : 'student',
  };

  inMemoryUsers.set(cleanRoll, record);

  if (isR2Configured()) {
    try {
      await writeJsonToR2(`registry/users/${cleanRoll}.json`, record);
      // Fetch or compute full user list for the index
      const existingIndex = (await readJsonFromR2<AdminUserRecord[]>('registry/users_index.json')) || [];
      const updatedIndex = [
        record,
        ...existingIndex.filter((u) => u.registrationNumber !== cleanRoll),
      ].sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime());

      await writeJsonToR2('registry/users_index.json', updatedIndex);
    } catch (err) {
      console.warn('R2 user persistence failed, cached in memory', err);
    }
  }

  return record;
}

export async function listVerifiedUsers(): Promise<AdminUserRecord[]> {
  const sanitize = (list: AdminUserRecord[]): AdminUserRecord[] => {
    return list.map((u) => ({
      ...u,
      role: OFFICIAL_ADMIN_REGISTRATION_NUMBERS.includes(u.registrationNumber as any) ? 'admin' : 'student',
    }));
  };

  if (isR2Configured()) {
    try {
      const fromR2 = await readJsonFromR2<AdminUserRecord[]>('registry/users_index.json');
      if (Array.isArray(fromR2) && fromR2.length > 0) {
        for (const u of fromR2) {
          if (!inMemoryUsers.has(u.registrationNumber)) {
            inMemoryUsers.set(u.registrationNumber, u);
          }
        }
        return sanitize(fromR2);
      }
    } catch (err) {
      console.warn('Failed reading users_index from R2', err);
    }
  }

  return sanitize(
    Array.from(inMemoryUsers.values()).sort(
      (a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
    )
  );
}

export async function syncUserBatch(users: UserLoginInput[]): Promise<AdminUserRecord[]> {
  const results: AdminUserRecord[] = [];
  for (const u of users) {
    const rawRoll = u.rollNumber || (u as any).student_id || (u as any).username;
    if (rawRoll) {
      const roll = String(rawRoll).trim().toUpperCase();
      const rec = await recordVerifiedLogin({
        rollNumber: roll,
        name: u.name || (u as any).full_name || roll,
        department: u.department || 'CSE',
        semester: u.semester || 'Sem 4',
        email: u.email || `${roll.toLowerCase()}@kluniversity.in`,
        role: u.role || 'student',
        courses: u.courses || [],
      }, false);
      results.push(rec);
    }
  }
  return results;
}
