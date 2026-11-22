import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { ErpProfile } from './client';

const profileSchema = z.object({
  name: z.string().min(1).max(200),
  rollNumber: z.string().min(1).max(64),
  department: z.string().max(200),
});
const sessionSchema = z.object({ profile: profileSchema, expiresAt: z.number().int() });
const BUCKET = 'vss-erp-sessions';
const tokenPattern = /^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{38,3000}$/;

function settings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const encodedKey = process.env.ERP_SESSION_ENCRYPTION_KEY;
  if (!url || !secret || !encodedKey) throw new Error('Supabase ERP sessions are not configured');
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new Error('Invalid ERP session encryption key');

  const db = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8_000) }) },
  });
  return { bucket: db.storage.from(BUCKET), key };
}

function sessionObject(token: string) {
  return createHash('sha256').update(token).digest('hex') + '.json';
}

export async function saveSupabaseSession(profile: ErpProfile, seconds: number) {
  const { bucket, key } = settings();
  const id = randomBytes(32).toString('base64url');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(id));
  const now = Date.now();
  const expiresAt = now + seconds * 1_000;
  const payload = JSON.stringify({ profile, expiresAt });
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const token = id + '.' + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');

  const { data: previousSessions } = await bucket.list('', {
    limit: 100,
    sortBy: { column: 'created_at', order: 'asc' },
  });
  const expired = previousSessions?.filter((item) =>
    /^[0-9a-f]{64}\.json$/.test(item.name) && Date.parse(item.created_at ?? '') <= now - seconds * 1_000,
  ).map((item) => item.name);
  if (expired?.length) await bucket.remove(expired);

  const { error } = await bucket.upload(sessionObject(token), '{}', { contentType: 'application/json' });
  if (error) throw new Error('Could not create ERP session');
  return token;
}

export async function getSupabaseSession(token: string) {
  if (!tokenPattern.test(token)) return null;
  const { bucket, key } = settings();
  const [id, payload] = token.split('.');
  let session: z.infer<typeof sessionSchema>;
  try {
    const bytes = Buffer.from(payload, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const plain = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
    session = sessionSchema.parse(JSON.parse(plain.toString('utf8')));
  } catch {
    return null;
  }

  if (session.expiresAt <= Date.now()) return null;
  const { data: active } = await bucket.exists(sessionObject(token));
  return active ? session.profile : null;
}

export async function endSupabaseSession(token: string) {
  if (!tokenPattern.test(token)) return;
  const { bucket } = settings();
  const { error } = await bucket.remove([sessionObject(token)]);
  if (error) throw new Error('Could not revoke ERP session');
}
