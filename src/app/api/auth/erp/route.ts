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
import { solveCaptcha, solverConfigured } from '@/lib/erp/solver';

const AUTO_SOLVE_ATTEMPTS = 4;

export const runtime = 'nodejs';

const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('challenge') }),
  z.object({ action: z.literal('logout') }),
  z.object({
    action: z.literal('autologin'),
    username: z.string().trim().regex(/^[A-Za-z0-9._-]{1,64}$/),
    password: z.string().min(1).max(256),
    acceptedTerms: z.literal(true),
  }),
  z.object({
    action: z.literal('login'),
    username: z.string().trim().regex(/^[A-Za-z0-9._-]{1,64}$/),
    password: z.string().min(1).max(256),
    captcha: z.string().trim().min(1).max(32),
    challengeId: z.string().min(1).max(4096),
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
    if (!profile) {
      const response = json({ authenticated: false }, 401);
      response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
      response.cookies.set(CHALLENGE_COOKIE, '', { path: '/', maxAge: 0 });
      return response;
    }
    return json({ authenticated: true, profile });
  } catch {
    const response = json({ error: 'Could not read the ERP session.' }, 503);
    response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
    response.cookies.set(CHALLENGE_COOKIE, '', { path: '/', maxAge: 0 });
    return response;
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

  if (input.action === 'autologin') {
    consumeChallenge(challengeCookie);
    if (!solverConfigured()) {
      return json({ error: 'Auto CAPTCHA is not set up. Enter the CAPTCHA manually.', fallback: true }, 503);
    }
    let lastError = 'Could not solve the CAPTCHA automatically.';
    for (let attempt = 1; attempt <= AUTO_SOLVE_ATTEMPTS; attempt++) {
      let started;
      try {
        started = await startErpChallenge();
      } catch {
        lastError = 'Could not load a CAPTCHA from KL ERP. Try again shortly.';
        break;
      }
      const guess = await solveCaptcha(started.image);
      if (!guess) continue; // unsure: fetch a fresh image straight away
      let profile;
      try {
        profile = await verifyErpLogin(started.challenge, {
          username: input.username,
          password: input.password,
          captcha: guess,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (/captcha/i.test(message)) {
          lastError = message;
          continue; // wrong guess: retry with a new CAPTCHA, no user action needed
        }
        return json({ error: message || 'KL ERP could not complete sign-in. Try again shortly.' }, 401);
      }
      if (!profile) {
        return json({ error: 'ERP could not verify this sign-in. Check your credentials and try again.' }, 401);
      }
      try {
        const id = await saveErpSession(profile);
        if (!id) return json({ error: 'Sign-in is busy. Try again shortly.' }, 503);
        await endErpSession(previousSession);
        await recordVerifiedLogin(profile, true, true).catch(() => undefined);
        return setCookie(setCookie(json({ ok: true, profile, attempts: attempt }), SESSION_COOKIE, id, SESSION_SECONDS), CHALLENGE_COOKIE, '', 0);
      } catch (error) {
        console.error('[ERP auto sign-in]', error instanceof Error ? error.message : 'Unknown error');
        return json({ error: 'KL ERP could not complete sign-in. Try again shortly.' }, 502);
      }
    }
    // Auto-solve gave up: hand a fresh CAPTCHA to the user for manual entry.
    try {
      const { challenge, image } = await startErpChallenge();
      const id = saveChallenge(challenge);
      if (id) return setCookie(json({ error: lastError, fallback: true, image, challengeId: id }, 200), CHALLENGE_COOKIE, id, CHALLENGE_SECONDS);
    } catch {}
    return json({ error: lastError, fallback: true }, 502);
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
    return clearChallenge(setCookie(json({ ok: true, profile }), SESSION_COOKIE, id, SESSION_SECONDS));
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERP sign-in]', stage, reason);
    if (stage === 'verify-erp' && error instanceof Error && error.message && !error.message.includes('ERP sign-in is unavailable')) {
      return clearChallenge(json({ error: error.message }, 401));
    }
    return clearChallenge(json({
      error: 'KL ERP could not complete sign-in. Try again shortly.',
      failureStage: stage,
    }, 502));
  }
}
