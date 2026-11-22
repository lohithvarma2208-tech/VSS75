import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { ErpProfile } from './client';

const profileSchema = z.object({
  name: z.string().min(1).max(200),
  rollNumber: z.string().min(1).max(64),
  department: z.string().max(200),
});
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
  return { db, key };
}

function fingerprint(id: string) {
  return createHash('sha256').update(id).digest('hex');
}

export async function saveSupabaseSession(profile: ErpProfile, seconds: number) {
  const { db, key } = settings();
  const id = randomBytes(32).toString('base64url');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(id));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(profile), 'utf8'), cipher.final()]);
  const token = id + '.' + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');

  const now = new Date();
  const { error: cleanupError } = await db.from('erp_sessions').delete().lte('expires_at', now.toISOString());
  if (cleanupError) throw new Error('Could not clean up ERP sessions');

  const { error } = await db.from('erp_sessions').insert({
    token_hash: fingerprint(token),
    expires_at: new Date(now.getTime() + seconds * 1_000).toISOString(),
  });
  if (error) throw new Error('Could not create ERP session');
  return token;
}

export async function getSupabaseSession(token: string) {
  if (!tokenPattern.test(token)) return null;
  const { db, key } = settings();
  const [id, payload] = token.split('.');
  let profile: ErpProfile;
  try {
    const bytes = Buffer.from(payload, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const plain = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
    profile = profileSchema.parse(JSON.parse(plain.toString('utf8')));
  } catch {
    return null;
  }

  const { data, error } = await db.from('erp_sessions')
    .select('expires_at')
    .eq('token_hash', fingerprint(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error('Could not read ERP session');
  return data ? profile : null;
}

export async function endSupabaseSession(token: string) {
  if (!tokenPattern.test(token)) return;
  const { db } = settings();
  const { error } = await db.from('erp_sessions').delete().eq('token_hash', fingerprint(token));
  if (error) throw new Error('Could not revoke ERP session');
}
