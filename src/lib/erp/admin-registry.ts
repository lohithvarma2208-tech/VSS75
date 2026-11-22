import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { ErpProfile } from './client';

const BUCKET = 'vss-admin-registry';
const recordSchema = z.object({
  registrationNumber: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  department: z.string().max(200),
  semester: z.string().max(80).optional(),
  academicYear: z.string().max(40).optional(),
  courses: z.array(z.object({ code: z.string(), name: z.string(), semester: z.string().optional() })).max(40),
  firstLoginAt: z.string().datetime(),
  lastLoginAt: z.string().datetime(),
  loginCount: z.number().int().positive(),
  consentVersion: z.string().max(40).optional(),
  consentedAt: z.string().datetime().optional(),
});

export type AdminUserRecord = z.infer<typeof recordSchema>;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Admin registry is not configured');
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function ensureBucket(db: ReturnType<typeof client>) {
  const { data } = await db.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 64 * 1024 });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
}

function objectName(registrationNumber: string) {
  return createHash('sha256').update(registrationNumber).digest('hex') + '.json';
}

export async function recordVerifiedLogin(profile: ErpProfile, incrementLogin = true, acceptedTerms = false) {
  const db = client();
  await ensureBucket(db);
  const bucket = db.storage.from(BUCKET);
  const path = objectName(profile.rollNumber);
  const now = new Date().toISOString();
  let previous: AdminUserRecord | null = null;
  const { data } = await bucket.download(path);
  if (data) {
    try { previous = recordSchema.parse(JSON.parse(await data.text())); } catch { previous = null; }
  }
  const record: AdminUserRecord = {
    registrationNumber: profile.rollNumber,
    name: profile.name,
    department: profile.department,
    semester: profile.semester,
    academicYear: profile.academicYear,
    courses: profile.courses || [],
    firstLoginAt: previous?.firstLoginAt || now,
    lastLoginAt: now,
    loginCount: previous ? previous.loginCount + (incrementLogin ? 1 : 0) : 1,
    consentVersion: acceptedTerms ? 'erp-login-v1' : previous?.consentVersion,
    consentedAt: acceptedTerms ? now : previous?.consentedAt,
  };
  const { error } = await bucket.upload(path, JSON.stringify(record), { contentType: 'application/json', upsert: true });
  if (error) throw error;
}

export async function listVerifiedUsers() {
  const db = client();
  await ensureBucket(db);
  const bucket = db.storage.from(BUCKET);
  const { data: files, error } = await bucket.list('', { limit: 1000, sortBy: { column: 'updated_at', order: 'desc' } });
  if (error) throw error;
  const records = await Promise.all((files || []).filter((file) => /^[0-9a-f]{64}\.json$/.test(file.name)).map(async (file) => {
    const { data } = await bucket.download(file.name);
    if (!data) return null;
    try { return recordSchema.parse(JSON.parse(await data.text())); } catch { return null; }
  }));
  return records.filter((record): record is AdminUserRecord => Boolean(record));
}
