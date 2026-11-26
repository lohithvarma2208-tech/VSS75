import { load } from 'cheerio';
import type { CookieJar } from 'tough-cookie';
import type { StudyRecord, StudySection } from '../study-types';
import { currentErpSelection, readErpAcademicPage, type ErpProfile } from './client';

const ATTENDANCE = 'studentattendance/studentdailyattendance';
const GRADES = 'studentinfo/studentendexamresult/searchgetmycgpa';
const TIMETABLE = 'timetables/universitymasteracademictimetableview/individualstudenttimetableget';
const ERP = 'https://newerp.kluniversity.in';
const codePattern = /^\d{2}[A-Z0-9]{2,12}$/i;

export class StudyUnavailable extends Error {}

function page(html: string) {
  const $ = load(html);
  if ($('input[name="LoginForm[username]"], input[name="LoginForm[password]"]').length) {
    throw new StudyUnavailable('Your ERP session expired. Sign out and sign back in to reconnect.');
  }
  return $;
}

function rows(html: string) {
  const $ = page(html);
  return $('table tr').toArray().map((row) =>
    $(row).children('td').toArray().map((cell) => $(cell).text().replace(/\s+/g, ' ').trim().slice(0, 200))
  );
}

function number(value?: string) {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function timetableRecords(html: string, profile: ErpProfile): StudyRecord[] {
  const $ = page(html);
  const read = (value: string) => value.replace(/\s+/g, ' ').trim().slice(0, 200);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const courseNames = new Map(profile.courses?.map((course) => [course.code.toUpperCase(), course.name]));
  const records: StudyRecord[] = [];
  let foundGrid = false;

  $('table').each((_, table) => {
    const tableRows = $(table).find('tr').toArray();
    const header = tableRows.findIndex((row) => $(row).children('th').length > 1);
    if (header < 0) return;
    const slots = $(tableRows[header]).children('th').toArray().slice(1).map((cell) => read($(cell).text()));
    if (!slots.some((slot) => /^\d{1,2}$|^(?:slot|period)\s*\d+|\d{1,2}:\d{2}/i.test(slot))) return;

    for (const row of tableRows.slice(header + 1)) {
      const cells = $(row).children('th, td').toArray();
      if (!cells.length) continue;
      const label = read($(cells[0]).text()).replace(/\.$/, '').toLowerCase();
      const day = days.find((name) => [name.toLowerCase(), name.slice(0, 3).toLowerCase()].includes(label));
      if (!day) continue;
      foundGrid = true;

      let slotIndex = 0;
      for (const cell of cells.slice(1)) {
        const span = Math.max(1, Number($(cell).attr('colspan')) || 1);
        const periods = slots.slice(slotIndex, slotIndex + span).filter(Boolean);
        slotIndex += span;
        const description = read($(cell).text());
        if (!periods.length || !description || /^(?:[-–—]+|free|no class|break|lunch|n\/?a)$/i.test(description)) continue;
        const code = description.match(/\b\d{2}[A-Z0-9]{2,12}\b/i)?.[0].toUpperCase() ?? '';
        const room = description.match(/\broom\s*(?:no\.?\s*)?[-:]\s*([A-Z0-9-]+)/i)?.[1] ?? '';
        const time = periods.every((period) => /^\d+$/.test(period))
          ? `Period ${periods.join('–')}`
          : periods.join(' · ');
        records.push({ kind: 'timetable', code, name: courseNames.get(code) ?? description, day, time, room, faculty: '' });
      }
    }
  });

  if (!foundGrid) throw new StudyUnavailable('ERP did not return a readable timetable for this term.');
  return records;
}

export async function readStudyRecords(jar: CookieJar, profile: ErpProfile, section: StudySection): Promise<StudyRecord[]> {
  if (section === 'attendance') {
    const landing = page(await readErpAcademicPage(jar, ATTENDANCE));
    const csrf = landing('input[name="_csrf"]').val() || landing('meta[name="csrf-token"]').attr('content');
    if (typeof csrf !== 'string' || !csrf) throw new StudyUnavailable('ERP did not return an attendance form.');
    const { year, period } = currentErpSelection(profile.rollNumber, profile.semester || '');
    const html = await readErpAcademicPage(jar, `${ATTENDANCE}/courselist`, new URLSearchParams({
      _csrf: csrf, 'DynamicModel[academicyear]': year.value, 'DynamicModel[semesterid]': period.value,
    }));
    return rows(html).flatMap((cells) => {
      const [code, name, component] = cells.slice(1, 4);
      const conducted = number(cells[8]);
      const attended = number(cells[9]);
      if (cells.length < 13 || !codePattern.test(code) || !name || conducted === null || attended === null || attended > conducted) return [];
      return [{ kind: 'attendance', code, name, component, conducted, attended }];
    });
  }

  if (section === 'grades') {
    return rows(await readErpAcademicPage(jar, GRADES)).flatMap((cells) => {
      const [code, name, grade] = cells.slice(3, 6);
      if (cells.length < 11 || !codePattern.test(code) || !name || !grade) return [];
      return [{ kind: 'grades', code, name, grade, points: number(cells[6]), credits: number(cells[7]), term: [cells[9], cells[10]].filter(Boolean).join(' · ') }];
    });
  }

  if (section === 'internals') {
    const dashboard = page(await readErpAcademicPage(jar, 'site/indexindi'));
    const route = dashboard('a[href]').toArray().map((element) => {
      const href = dashboard(element).attr('href') || '';
      try {
        const url = new URL(href, ERP);
        if (url.origin !== ERP || url.pathname !== '/index.php' || url.username || url.password) return null;
        const candidate = url.searchParams.get('r') ?? '';
        return /^(?:studentinfo|studentexam|studentmarks)\/[a-z-]*internal[a-z/-]*$/i.test(candidate) ? candidate : null;
      } catch {
        return null;
      }
    }).find(Boolean);
    if (!route) throw new StudyUnavailable('ERP did not list an internal marks page. Open ERP to check your assessments.');

    const $ = page(await readErpAcademicPage(jar, route));
    const records: StudyRecord[] = [];
    $('table').each((_, table) => {
      const labels = $(table).find('th').map((__, cell) => $(cell).text().trim().toLowerCase()).get();
      const codeIndex = labels.findIndex((label) => /(?:course|subject)\s*code/.test(label));
      const markIndex = labels.findIndex((label) => /obtained|scored|secured|^marks$/.test(label));
      if (codeIndex === -1 || markIndex === -1) return;
      const nameIndex = labels.findIndex((label) => /(?:course|subject)\s*(?:name|title)/.test(label));
      const assessmentIndex = labels.findIndex((label) => /assessment|component|exam name/.test(label));
      const maxIndex = labels.findIndex((label) => /max(?:imum)?\s*marks|out of/.test(label));
      $(table).find('tr').each((__, row) => {
        const cells = $(row).children('td').map((___, cell) => $(cell).text().replace(/\s+/g, ' ').trim().slice(0, 200)).get();
        if (!codePattern.test(cells[codeIndex]) || number(cells[markIndex]) === null) return;
        records.push({ kind: 'internals', code: cells[codeIndex], name: cells[nameIndex] || '', assessment: cells[assessmentIndex] || 'Internal marks', mark: cells[markIndex], outOf: cells[maxIndex] || '' });
      });
    });
    if (!records.length) throw new StudyUnavailable('ERP did not return a readable internal marks table. Open ERP to check your assessments.');
    return records;
  }

  if (section === 'timetable') {
    const { year, period } = currentErpSelection(profile.rollNumber, profile.semester || '');
    const html = await readErpAcademicPage(jar, TIMETABLE, undefined, new URLSearchParams({
      'UniversityMasterAcademicTimetableView[academicyear]': year.value,
      'UniversityMasterAcademicTimetableView[semesterid]': period.value,
    }));
    return timetableRecords(html, profile);
  }

  throw new StudyUnavailable('Invalid study section.');
}
