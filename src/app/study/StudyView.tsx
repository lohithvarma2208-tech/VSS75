'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, ClipboardList, Clock, GraduationCap, RefreshCw } from 'lucide-react';
import { STUDY_SECTIONS, type StudyRecord, type StudyResponse, type StudySection } from '@/lib/study-types';

const sections = {
  attendance: { name: 'Attendance', icon: Activity },
  grades: { name: 'Grades', icon: GraduationCap },
  internals: { name: 'Internals', icon: ClipboardList },
  timetable: { name: 'Timetable', icon: Clock },
};

const TIMETABLE_DAYS = [
  { key: 'Mon', label: 'Mon', full: 'Monday' },
  { key: 'Tue', label: 'Tue', full: 'Tuesday' },
  { key: 'Wed', label: 'Wed', full: 'Wednesday' },
  { key: 'Thurs', label: 'Thurs', full: 'Thursday' },
  { key: 'Fri', label: 'Fri', full: 'Friday' },
  { key: 'Sat', label: 'Sat', full: 'Saturday' },
  { key: 'Sun', label: 'Sun', full: 'Sunday' },
] as const;

export default function StudyView({ section }: { section: StudySection }) {
  const [result, setResult] = useState<StudyResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'signed-out' | 'error'>('loading');
  const [request, setRequest] = useState(0);
  const [term, setTerm] = useState('');

  // Default to today's day of the week
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const dayIndex = new Date().getDay();
    const map: Record<number, string> = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thurs',
      5: 'Fri',
      6: 'Sat',
    };
    return map[dayIndex] || 'Mon';
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/study?section=${section}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (controller.signal.aborted) return;
        if (response.status === 401) { setStatus('signed-out'); return; }
        if (!response.ok) throw new Error('Study request failed');
        const data: StudyResponse = await response.json();
        if (controller.signal.aborted) return;
        setResult(data);
        setStatus('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [request, section]);

  const records = result?.records ?? [];
  const grades = records.filter((row) => row.kind === 'grades');
  const attendance = records.filter((row) => row.kind === 'attendance');
  const timetable = records.filter((row) => row.kind === 'timetable');
  const terms = [...new Set(grades.map((row) => row.term).filter(Boolean))];

  const visibleRows = useMemo(() => {
    if (section === 'timetable') {
      const target = selectedDay.toLowerCase().slice(0, 3);
      return timetable.filter((row) => (row.day || '').toLowerCase().startsWith(target));
    }
    if (section === 'grades' && term) {
      return grades.filter((row) => row.term === term);
    }
    return records;
  }, [section, selectedDay, timetable, term, grades, records]);

  const conducted = attendance.reduce((sum, row) => sum + row.conducted, 0);
  const attended = attendance.reduce((sum, row) => sum + row.attended, 0);
  const Icon = sections[section]?.icon || Activity;

  function refresh() {
    setStatus('loading');
    setTerm('');
    setRequest((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-7 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/65">KL ERP</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Study</h1>
        </div>
        <a href="https://newerp.kluniversity.in/" target="_blank" rel="noreferrer" className="vss-button-secondary">Open ERP <ArrowUpRight size={16} aria-hidden="true" /></a>
      </header>
      <nav aria-label="Study sections" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl border border-white/10 bg-vss-surface p-1.5">
        {STUDY_SECTIONS.map((item) => {
          const TabIcon = sections[item].icon;
          return <Link key={item} href={`/study/${item}`} aria-current={item === section ? 'page' : undefined} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium sm:flex-row sm:gap-2 sm:text-sm ${item === section ? 'bg-vss-accent/15 text-vss-accent' : 'text-white/70 hover:bg-white/5'}`}>
            <TabIcon size={17} aria-hidden="true" /> {sections[item].name}
          </Link>;
        })}
      </nav>
      <section aria-labelledby="study-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="study-heading" className="text-xl font-semibold tracking-tight">{sections[section].name}</h2>
            {section === 'attendance' && result?.semester && <p className="mt-1 text-sm text-white/65">{[result.semester, result.academicYear].filter(Boolean).join(' · ')}</p>}
            {section === 'timetable' && result?.semester && <p className="mt-1 text-sm text-white/65">{[result.semester, result.academicYear].filter(Boolean).join(' · ')}</p>}
          </div>
          {status !== 'signed-out' && <button type="button" onClick={refresh} disabled={status === 'loading'} className="vss-button-secondary px-3 disabled:opacity-50">
            <RefreshCw size={15} aria-hidden="true" className={status === 'loading' ? 'motion-safe:animate-spin' : ''} /> {status === 'loading' ? 'Syncing…' : 'Sync from ERP'}
          </button>}
        </div>
        {status === 'loading' && <p role="status" className="vss-card p-5 text-sm text-white/70">Loading ERP records…</p>}
        {status === 'error' && <p role="alert" className="vss-card p-5 text-sm text-white/70">Could not load your records. Try refreshing or open ERP.</p>}
        {status === 'signed-out' && <div className="vss-card p-5"><p className="text-sm text-white/75">Sign in to view your ERP records.</p><Link href="/auth/login" className="vss-button mt-3">Sign in</Link></div>}
        {status === 'ready' && (
          <>
            {section === 'attendance' && conducted > 0 && (
              <div className="rounded-2xl border border-vss-accent/15 bg-[#1a2826] p-5">
                <p className="text-sm text-white/75">Overall attendance</p>
                <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-vss-accent">{(attended / conducted * 100).toFixed(1)}%</p>
                <p className="mt-1 text-sm text-white/70">{attended} of {conducted} classes attended</p>
              </div>
            )}
            {section === 'grades' && terms.length > 1 && (
              <label className="block max-w-xs text-sm text-white/75">Academic term
                <select className="profile-input mt-1.5" value={term} onChange={(event) => setTerm(event.target.value)}>
                  <option value="">All terms</option>
                  {terms.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )}

            {section === 'timetable' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {TIMETABLE_DAYS.map((day) => {
                  const isSelected = selectedDay === day.key;
                  const dayClassCount = timetable.filter((r) =>
                    (r.day || '').toLowerCase().startsWith(day.key.toLowerCase().slice(0, 3))
                  ).length;
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedDay(day.key)}
                      className={`flex flex-1 min-w-[50px] sm:min-w-[65px] flex-col items-center justify-center rounded-xl py-2 px-1 text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-vss-accent text-black font-bold shadow-sm'
                          : 'border border-white/10 bg-vss-surface text-white/75 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-semibold">{day.label}</span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-black/80 font-medium' : 'text-white/40'}`}>
                        {dayClassCount > 0 ? `${dayClassCount} class${dayClassCount > 1 ? 'es' : ''}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {visibleRows.length > 0 ? (
              <ul className="vss-card divide-y divide-white/[.07]">
                {visibleRows.map((row, index) => <RecordRow key={`${row.code}-${index}`} row={row} />)}
              </ul>
            ) : (
              <div className="vss-card flex items-start gap-3 p-5 text-sm text-white/70">
                <Icon size={18} className="shrink-0 text-vss-accent" aria-hidden="true" />
                <p>
                  {section === 'timetable'
                    ? `No classes scheduled for ${TIMETABLE_DAYS.find((d) => d.key === selectedDay)?.full || selectedDay}.`
                    : (result?.message || 'ERP returned no records for this section.')}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function RecordRow({ row }: { row: StudyRecord }) {
  const detail = row.kind === 'attendance'
    ? [row.component, `${row.attended}/${row.conducted} attended`].filter(Boolean).join(' · ')
    : row.kind === 'grades' ? row.term
    : row.kind === 'timetable' ? [row.room ? `Room ${row.room}` : '', row.faculty].filter(Boolean).join(' · ')
    : row.assessment;
  const result = row.kind === 'attendance'
    ? (row.conducted ? `${(row.attended / row.conducted * 100).toFixed(1)}%` : '—')
    : row.kind === 'grades' ? row.grade
    : row.kind === 'timetable' ? row.time
    : [row.mark, row.outOf].filter(Boolean).join(' / ');
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-3.5 sm:p-4">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium">{row.name || row.code}</p>
        <p className="mt-1 break-words text-xs text-white/65">{[row.code, detail].filter(Boolean).join(' · ')}</p>
      </div>
      <span className="rounded-lg bg-vss-accent/10 px-2.5 py-1 text-sm font-semibold tabular-nums text-vss-accent">{result}</span>
    </li>
  );
}
