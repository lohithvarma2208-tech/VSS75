import { load } from 'cheerio';
import { CookieJar } from 'tough-cookie';

const ERP_ORIGIN = 'https://newerp.kluniversity.in';
const HOME_URL = new URL('/index.php', ERP_ORIGIN);
const PROFILE_URL = new URL('/index.php?r=site%2Findexindi', ERP_ORIGIN);

export interface ErpProfile {
  name: string;
  rollNumber: string;
  department: string;
  semester?: string;
  academicYear?: string;
  courses?: { code: string; name: string; semester?: string }[];
}

export interface ErpChallenge {
  jar: CookieJar;
  formUrl: URL;
  pageUrl: URL;
  fields: [string, string][];
}

interface LoginInput {
  username: string;
  password: string;
  captcha: string;
}

function erpUrl(value: string, base: URL, route?: string) {
  const url = new URL(value, base);
  if (
    url.origin !== ERP_ORIGIN ||
    url.username ||
    url.password ||
    !['/', '/index.php'].includes(url.pathname) ||
    (route && url.searchParams.get('r') !== route)
  ) {
    throw new Error('Unexpected ERP URL');
  }
  return url;
}

async function requestErp(jar: CookieJar, url: URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const cookie = await jar.getCookieString(url.href);
  if (cookie) headers.set('Cookie', cookie);

  const response = await fetch(url, {
    ...init,
    headers,
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  for (const value of response.headers.getSetCookie()) {
    await jar.setCookie(value, url.href, { ignoreError: true });
  }

  return response;
}

async function getLoginPage(jar: CookieJar) {
  let pageUrl = HOME_URL;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await requestErp(jar, pageUrl);
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      pageUrl = erpUrl(location, pageUrl);
      continue;
    }
    if (!response.ok) throw new Error('ERP sign-in is unavailable');
    return { pageUrl, html: await response.text() };
  }
  throw new Error('ERP login page redirected too many times');
}

export async function startErpChallenge() {
  const jar = new CookieJar();
  const { pageUrl, html } = await getLoginPage(jar);
  const $ = load(html);
  const form = $('#login-form');
  const action = form.attr('action');
  const image = form.find('#loginFormCaptcha-image').attr('src');
  const fields: [string, string][] = [];
  form.find('input[type="hidden"][name]').each((_, input) => {
    const name = $(input).attr('name');
    if (name) fields.push([name, $(input).attr('value') ?? '']);
  });
  if (!action || !image || !fields.some(([name, value]) => name === '_csrf' && value)) {
    throw new Error('ERP sign-in form is unavailable');
  }

  const formUrl = erpUrl(action, pageUrl, 'site/login');
  const imageUrl = erpUrl(image, pageUrl, 'site/captcha');
  const response = await requestErp(jar, imageUrl, {
    headers: { Referer: pageUrl.href },
  });
  if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'image/png') {
    throw new Error('ERP CAPTCHA is unavailable');
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 128 * 1024) throw new Error('Invalid ERP CAPTCHA');

  return {
    challenge: { jar, formUrl, pageUrl, fields },
    image: 'data:image/png;base64,' + bytes.toString('base64'),
  };
}

function parseProfile(html: string, username: string): ErpProfile | null {
  const $ = load(html);
  if ($('#login-form').length) return null;

  function field(...labels: string[]) {
    const heading = $('b').filter((_, element) =>
      labels.includes($(element).text().trim().replace(/\s*:\s*$/, '').toLowerCase()),
    ).first();
    return heading.parent('div').next('div').text().replace(/\s+/g, ' ').trim();
  }

  const name = field('name');
  const rollNumber = field('roll no');
  const department = field('department');
  const semester = field('semester', 'current semester', 'current sem', 'term');
  const academicYear = field('academic year', 'current academic year');
  if (
    !name || name.length > 200 ||
    rollNumber.toLowerCase() !== username.toLowerCase() ||
    department.length > 200
  ) return null;

  const courses: { code: string; name: string; semester?: string }[] = [];
  const seen = new Set<string>();
  $('tr').each((_, row) => {
    const cells = $(row).find('td').map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim()).get();
    const joined = cells.join(' ');
    const code = joined.match(/\b\d{2}[A-Z]{2,4}\d{3,4}[A-Z]?\b/i)?.[0]?.toUpperCase();
    if (!code || seen.has(code)) return;
    const nameCell = cells.find((cell) => cell !== code && cell.length >= 4 && cell.length <= 160 && /[A-Za-z]{3}/.test(cell) && !/^(L|T|P|S|LTPS|Section)$/i.test(cell));
    if (!nameCell) return;
    seen.add(code);
    courses.push({ code, name: nameCell.replace(code, '').replace(/^[-–—:\s]+/, '').trim() || nameCell, semester: semester || undefined });
  });

  return { name, rollNumber, department, semester: semester || undefined, academicYear: academicYear || undefined, courses: courses.slice(0, 24) };
}

export async function verifyErpLogin(challenge: ErpChallenge, input: LoginInput) {
  const { jar, formUrl, pageUrl, fields } = challenge;
  const body = new URLSearchParams(fields);
  body.set('LoginForm[username]', input.username);
  body.set('LoginForm[password]', input.password);
  body.set('LoginForm[captcha]', input.captcha);
  body.set('login-button', '');

  const response = await requestErp(jar, formUrl, {
    method: 'POST',
    headers: {
      Referer: pageUrl.href,
      Origin: ERP_ORIGIN,
      'X-CSRF-Token': body.get('_csrf') ?? '',
      'X-Requested-With': 'XMLHttpRequest',
      'X-PJAX': 'true',
      'X-PJAX-Container': '#login-jax',
    },
    body,
  });

  if (response.ok) {
    const html = await response.text();
    const profile = parseProfile(html, input.username);
    if (profile) return profile;
    if (load(html)('#login-form').length) return null;
  } else {
    await response.body?.cancel();
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 422) return null;
    if (![301, 302, 303].includes(response.status)) throw new Error('ERP sign-in is unavailable');
  }

  // A redirect alone is insufficient. Confirm the roll number on the authenticated page.
  const dashboard = await requestErp(jar, PROFILE_URL);
  if (!dashboard.ok) {
    await dashboard.body?.cancel();
    if (dashboard.status === 429 || dashboard.status >= 500) throw new Error('ERP profile is unavailable');
    return null;
  }
  return parseProfile(await dashboard.text(), input.username);
}
