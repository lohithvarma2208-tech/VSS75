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

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLabel(value: string) {
  return cleanText(value).replace(/\s*:\s*$/, '').toLowerCase();
}

function normalizeSemester(value: string) {
  const text = cleanText(value);
  if (!text) return '';
  const tri = text.match(/(?:tri[\s-]*sem(?:ester)?|trimester|term|\bT)\s*[-:#]?\s*(\d{1,2})/i);
  if (tri) return `Tri-Sem ${Number(tri[1])} (T${Number(tri[1])})`;
  const regular = text.match(/(?:semester|sem)\s*[-:#]?\s*(\d{1,2})/i);
  if (regular) return `Sem ${Number(regular[1])}`;
  const bare = text.match(/^(\d{1,2})$/);
  if (bare && Number(bare[1]) >= 1 && Number(bare[1]) <= 12) return `Sem ${Number(bare[1])}`;
  return '';
}

function parseProfile(html: string, username: string): ErpProfile | null {
  const $ = load(html);
  if ($('#login-form').length) return null;

  function field(...labels: string[]) {
    const wanted = new Set(labels.map(normalizeLabel));
    let result = '';

    $('tr').each((_, row) => {
      if (result) return;
      const cells = $(row).find('th,td').map((__, cell) => cleanText($(cell).text())).get();
      if (cells.length >= 2 && wanted.has(normalizeLabel(cells[0]))) result = cells[1];
    });
    if (result) return result;

    $('b,strong,label').each((_, element) => {
      if (result || !wanted.has(normalizeLabel($(element).text()))) return;
      const parent = $(element).parent();
      result = cleanText(parent.next().text()) || cleanText(parent.next('div').text());
    });
    return result;
  }

  const name = field('name');
  const rollNumber = field('roll no');
  const department = field('department');
  const semester = normalizeSemester(field('semester', 'current semester', 'current sem', 'current term', 'term'));
  const academicYear = field('academic year', 'current academic year');
  if (
    !name || name.length > 200 ||
    rollNumber.toLowerCase() !== username.toLowerCase() ||
    department.length > 200
  ) return null;

  const courses: { code: string; name: string; semester?: string }[] = [];
  const seen = new Set<string>();
  $('table').each((_, table) => {
    const context = cleanText([
      $(table).attr('id') || '',
      $(table).attr('class') || '',
      $(table).find('caption').first().text(),
      $(table).prevAll('h1,h2,h3,h4,h5,.panel-title,.card-title').first().text(),
    ].join(' ')).toLowerCase();
    if (/grade|result|transcript|history|completed/.test(context)) return;

    const rows = $(table).find('tr').toArray();
    const headerIndex = rows.findIndex((row) => {
      const headers = $(row).find('th,td').map((__, cell) => normalizeLabel($(cell).text())).get();
      return headers.some((header) => /^(course|subject)\s*code$|^coursecode$/.test(header)) &&
        headers.some((header) => /^(course|subject)\s*(name|description|desc|title)$|^coursedesc$/.test(header));
    });
    if (headerIndex < 0) return;

    const headers = $(rows[headerIndex]).find('th,td').map((__, cell) => normalizeLabel($(cell).text())).get();
    const isCurrentCourseTable = /registration|registered|current\s+course|attendance|timetable|course\s*wise/.test(context) ||
      headers.some((header) => /^(ltps|section|faculty|instructor|teacher)$/.test(header));
    if (!isCurrentCourseTable || headers.some((header) => /grade|credit|result/.test(header))) return;
    const codeIndex = headers.findIndex((header) => /^(course|subject)\s*code$|^coursecode$/.test(header));
    const nameIndex = headers.findIndex((header) => /^(course|subject)\s*(name|description|desc|title)$|^coursedesc$/.test(header));
    const semesterIndex = headers.findIndex((header) => /^(current\s*)?(semester|sem|term)$/.test(header));

    rows.slice(headerIndex + 1).forEach((row) => {
      const cells = $(row).find('td').map((__, cell) => cleanText($(cell).text())).get();
      const code = cells[codeIndex]?.match(/^\s*(\d{2}[A-Z]{2,4}\d{3,4}[A-Z]?)\s*$/i)?.[1]?.toUpperCase();
      const courseName = cells[nameIndex]?.replace(/^[-–—:\s]+/, '').trim();
      const rowSemester = semesterIndex >= 0 ? normalizeSemester(cells[semesterIndex] || '') : semester;
      if (!code || seen.has(code) || !courseName || courseName.length > 160 || !/[A-Za-z]{3}/.test(courseName)) return;
      if (semester && rowSemester && rowSemester !== semester) return;
      seen.add(code);
      courses.push({ code, name: courseName, semester: rowSemester || semester || undefined });
    });
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
