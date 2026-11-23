import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { CookieJar } from 'tough-cookie';
import type { ErpChallenge, ErpProfile } from './client';
import { endSupabaseSession, getSupabaseSession, saveSupabaseSession } from './supabase-session';

export const CHALLENGE_COOKIE = 'vss_erp_challenge';
export const SESSION_COOKIE = 'vss_erp_session';
export const CHALLENGE_SECONDS = 5 * 60; // 5 minutes
export const SESSION_SECONDS = 24 * 60 * 60; // 24 hours

const globalState = globalThis as typeof globalThis & {
  vssErpState?: {
    challenges: Map<string, { value: ErpChallenge; expires: number }>;
    sessions: Map<string, { value: ErpProfile; expires: number }>;
  };
};

const state: NonNullable<typeof globalState.vssErpState> = globalState.vssErpState ??= {
  challenges: new Map(),
  sessions: new Map(),
};

function getSecretKey(): Buffer {
  const secret =
    process.env.ERP_SESSION_ENCRYPTION_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    'vss_internal_erp_session_secure_key_2026_klu';
  return createHash('sha256').update(secret).digest();
}

function sealToken<T>(data: T, seconds: number): string {
  const key = getSecretKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const payload = Buffer.from(
    JSON.stringify({ value: data, expires: Date.now() + seconds * 1000 }),
    'utf8'
  );
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12) + tag(16) + ciphertext
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

function unsealToken<T>(token: string): T | null {
  try {
    const key = getSecretKey();
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString('utf8'));
    if (typeof parsed?.expires !== 'number' || parsed.expires <= Date.now()) return null;
    return parsed.value as T;
  } catch {
    return null;
  }
}

export function saveChallenge(challenge: ErpChallenge): string {
  const raw = {
    jar: challenge.jar.toJSON(),
    formUrl: challenge.formUrl.href,
    pageUrl: challenge.pageUrl.href,
    fields: challenge.fields,
  };
  const token = sealToken(raw, CHALLENGE_SECONDS);
  state.challenges.set(token, { value: challenge, expires: Date.now() + CHALLENGE_SECONDS * 1000 });
  return token;
}

export function consumeChallenge(token: string): ErpChallenge | null {
  if (!token) return null;
  const cached = state.challenges.get(token);
  if (cached && cached.expires > Date.now()) {
    state.challenges.delete(token);
    return cached.value;
  }
  state.challenges.delete(token);

  const unsealed = unsealToken<{
    jar: unknown;
    formUrl: string;
    pageUrl: string;
    fields: [string, string][];
  }>(token);

  if (!unsealed) return null;
  try {
    return {
      jar: CookieJar.fromJSON(unsealed.jar as any),
      formUrl: new URL(unsealed.formUrl),
      pageUrl: new URL(unsealed.pageUrl),
      fields: unsealed.fields,
    };
  } catch {
    return null;
  }
}

const useSupabase = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.ERP_SESSION_ENCRYPTION_KEY
  );

export async function saveErpSession(profile: ErpProfile): Promise<string | null> {
  if (useSupabase()) return saveSupabaseSession(profile, SESSION_SECONDS);
  const token = sealToken(profile, SESSION_SECONDS);
  state.sessions.set(token, { value: profile, expires: Date.now() + SESSION_SECONDS * 1000 });
  return token;
}

export async function getErpSession(token: string): Promise<ErpProfile | null> {
  if (!token) return null;
  if (useSupabase()) return getSupabaseSession(token);
  const cached = state.sessions.get(token);
  if (cached && cached.expires > Date.now()) return cached.value;
  const unsealed = unsealToken<ErpProfile>(token);
  if (unsealed) {
    state.sessions.set(token, { value: unsealed, expires: Date.now() + SESSION_SECONDS * 1000 });
    return unsealed;
  }
  return null;
}

export async function endErpSession(token: string): Promise<void> {
  if (!token) return;
  if (useSupabase()) await endSupabaseSession(token);
  state.sessions.delete(token);
}
