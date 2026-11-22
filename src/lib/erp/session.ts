import { randomBytes } from 'node:crypto';
import type { ErpChallenge, ErpProfile } from './client';
import { endSupabaseSession, getSupabaseSession, saveSupabaseSession } from './supabase-session';

export const CHALLENGE_COOKIE = 'vss_erp_challenge';
export const SESSION_COOKIE = 'vss_erp_session';
export const CHALLENGE_SECONDS = 3 * 60;
export const SESSION_SECONDS = 60 * 60;

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

function save<T>(store: Map<string, { value: T; expires: number }>, value: T, seconds: number, limit: number) {
  const now = Date.now();
  store.forEach((entry, id) => {
    if (entry.expires <= now) store.delete(id);
  });
  if (store.size >= limit) return null;
  const id = randomBytes(32).toString('base64url');
  store.set(id, { value, expires: now + seconds * 1_000 });
  return id;
}

function read<T>(store: Map<string, { value: T; expires: number }>, id: string, consume = false) {
  const entry = store.get(id);
  if (!entry) return null;
  if (consume || entry.expires <= Date.now()) store.delete(id);
  return entry.expires > Date.now() ? entry.value : null;
}

export const saveChallenge = (challenge: ErpChallenge) =>
  save(state.challenges, challenge, CHALLENGE_SECONDS, 128);
export const consumeChallenge = (id: string) => read(state.challenges, id, true);
const useSupabase = () => process.env.NODE_ENV === 'production' || Boolean(process.env.SUPABASE_SECRET_KEY);

export async function saveErpSession(profile: ErpProfile) {
  return useSupabase()
    ? saveSupabaseSession(profile, SESSION_SECONDS)
    : save(state.sessions, profile, SESSION_SECONDS, 2_000);
}

export async function getErpSession(token: string) {
  return useSupabase() ? getSupabaseSession(token) : read(state.sessions, token);
}

export async function endErpSession(token: string) {
  if (useSupabase()) await endSupabaseSession(token);
  else state.sessions.delete(token);
}
