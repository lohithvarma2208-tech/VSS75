import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { startErpChallenge, verifyErpLogin } from '@/lib/erp/client';
import {
  CHALLENGE_COOKIE,
  CHALLENGE_SECONDS,
  consumeChallenge,
  endErpSession,
  getErpSession,
  saveChallenge,
  saveErpSession,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from '@/lib/erp/session';
import { recordVerifiedLogin } from '@/lib/erp/admin-registry';

export const runtime = 'nodejs';

const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('challenge') }),
  z.object({ action: z.literal('logout') }),
  z.object({
    action: z.literal('login'),
    username: z.string().trim().regex(/^[A-Za-z0-9._-]{1,64}$/),
    password: z.string().min(1).max(256),
    captcha: z.string().trim().min(1).max(32),
    challengeId: z.string().regex(/^[\w-]{43}$/),
    acceptedTerms: z.literal(true),
  }),
]);

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function setCookie(response: NextResponse, name: string, value: string, maxAge: number) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  if (!token) return json({ authenticated: false }, 401);
  try {
    const profile = await getErpSession(token);
    return profile ? json({ authenticated: true, profile }) : json({ authenticated: false }, 401);
  } catch {
    return json({ error: 'Could not read the ERP session.' }, 503);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const sameOrigin = host && (origin === 'https://' + host || origin === 'http://' + host);
  const publicOrigin = process.env.ERP_PUBLIC_ORIGIN;
  if (!origin || (!sameOrigin && origin !== publicOrigin)) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return json({ error: 'Expected a JSON request.' }, 415);
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Check the sign-in fields and try again.' }, 400);

  const input = parsed.data;
  const challengeCookie = request.cookies.get(CHALLENGE_COOKIE)?.value ?? '';
  const previousSession = request.cookies.get(SESSION_COOKIE)?.value ?? '';

  if (input.action === 'logout') {
    consumeChallenge(challengeCookie);
    try {
      await endErpSession(previousSession);
      return setCookie(setCookie(json({ ok: true }), SESSION_COOKIE, '', 0), CHALLENGE_COOKIE, '', 0);
    } catch {
      return json({ error: 'Could not sign out. Try again shortly.' }, 503);
    }
  }

  if (input.action === 'challenge') {
    consumeChallenge(challengeCookie);
    try {
      const { challenge, image } = await startErpChallenge();
      const id = saveChallenge(challenge);
      if (!id) return json({ error: 'Sign-in is busy. Try again shortly.' }, 503);
      return setCookie(json({ image, challengeId: id }), CHALLENGE_COOKIE, id, CHALLENGE_SECONDS);
    } catch {
      return json({ error: 'Could not load a CAPTCHA from KL ERP. Try again shortly.' }, 502);
    }
  }

  if (input.challengeId !== challengeCookie) {
    return json({ error: 'This CAPTCHA was replaced. Load a new CAPTCHA to continue.' }, 409);
  }
  const challenge = consumeChallenge(challengeCookie);
  const clearChallenge = (response: NextResponse) =>
    setCookie(response, CHALLENGE_COOKIE, '', 0);

  if (!challenge) return clearChallenge(json({ error: 'This CAPTCHA expired. Load a new one.' }, 410));

  let stage = 'verify-erp';
  try {
    const profile = await verifyErpLogin(challenge, input);
    if (!profile) {
      return clearChallenge(json({
        error: 'ERP could not verify this sign-in. Check your credentials and try with a new CAPTCHA.',
      }, 401));
    }
    stage = 'save-session';
    const id = await saveErpSession(profile);
    if (!id) return clearChallenge(json({ error: 'Sign-in is busy. Try again shortly.' }, 503));
    stage = 'replace-session';
    await endErpSession(previousSession);
    stage = 'record-login';
    await recordVerifiedLogin(profile, true, true).catch(() => undefined);
    return clearChallenge(setCookie(json({ ok: true }), SESSION_COOKIE, id, SESSION_SECONDS));
  } catch (error) {
    console.error('[ERP sign-in]', stage, error instanceof Error ? error.message : 'Unknown error');
    return clearChallenge(json({ error: 'KL ERP could not complete sign-in. Try again shortly.' }, 502));
  }
}
