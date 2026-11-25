'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  MapPin,
  User,
  GraduationCap,
  Sparkles,
  Printer,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { StudentTimetable, TimetableDay, TimetableSlot } from '@/types';
import { getStudentTimetable, getLiveScheduleStatus } from '@/lib/erp/academic-schedule';

const DAYS: TimetableDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
  const { currentUser, showToast } = useApp();
  const [timetable, setTimetable] = useState<StudentTimetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<TimetableDay>('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'grid'>('day');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every 30 seconds for live period tracking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Automatically set default selected day to current day of week if Monday-Saturday
    const dayNames: TimetableDay[] = ['Sunday' as TimetableDay, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[new Date().getDay()];
    if (currentDayName && DAYS.includes(currentDayName)) {
      setSelectedDay(currentDayName);
    }

    async function loadTimetable() {
      setLoading(true);
      try {
        const studentId = currentUser?.student_id || currentUser?.username || '2600080191';
        const res = await fetch(`/api/erp/timetable?studentId=${encodeURIComponent(studentId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.timetable) {
            setTimetable(data.timetable);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch timetable from API:', err);
      }

      const studentId = currentUser?.student_id || currentUser?.username || '2600080191';
      const localTimetable = getStudentTimetable(studentId, currentUser?.registered_courses || [], {
        semester: currentUser?.semester,
      });
      setTimetable(localTimetable);
      setLoading(false);
    }

    loadTimetable();
  }, [currentUser]);

  const liveStatus = useMemo(() => {
    if (!timetable) return null;
    return getLiveScheduleStatus(timetable.slots, currentTime);
  }, [timetable, currentTime]);

  const slotsForSelectedDay = useMemo(() => {
    if (!timetable) return [];
    return timetable.slots.filter((s) => s.day === selectedDay);
  }, [timetable, selectedDay]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Clock className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm font-bold text-white/50">Loading student timetable from KL ERP…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-8 sm:py-10">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#121215] p-6 text-white sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,.18),transparent_40%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 font-mono text-[10px] font-bold text-violet-300">
                <Clock className="h-3 w-3" /> Official KL ERP Timetable
              </span>
              <span className="text-[11px] text-white/40">· Section {timetable?.section}</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Student Class Timetable
            </h1>
            <p className="max-w-xl text-xs text-white/50 sm:text-sm">
              Your weekly lecture, tutorial, and laboratory schedule synchronized with KL ERP. Shows live period status, classrooms, and faculty assignments.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5 font-mono text-white/90">
                <User className="h-3.5 w-3.5 text-violet-400" /> Roll No: {timetable?.studentId}
              </span>
              <span className="text-white/20">•</span>
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <GraduationCap className="h-3.5 w-3.5 text-violet-400" /> {timetable?.semester}
              </span>
              <span className="text-white/20">•</span>
              <span className="inline-flex items-center gap-1.5 text-white/70 font-mono">
                Section: {timetable?.section}
              </span>
            </div>
          </div>

          {/* Live Status Widget */}
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-md min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-violet-300 uppercase flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE STATUS
              </span>
              <span className="text-[11px] font-mono text-white/40">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {liveStatus?.currentSlot ? (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-400">CLASS IN SESSION:</span>
                <p className="font-extrabold text-sm text-white truncate">
                  {liveStatus.currentSlot.courseCode} · {liveStatus.currentSlot.courseName}
                </p>
                <p className="text-[11px] text-white/60 flex items-center gap-1 font-mono">
                  <MapPin className="h-3 w-3 text-violet-400" /> {liveStatus.currentSlot.room} ({liveStatus.currentSlot.startTime} - {liveStatus.currentSlot.endTime})
                </p>
              </div>
            ) : liveStatus?.nextSlot ? (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-violet-300">UPCOMING NEXT:</span>
                <p className="font-extrabold text-sm text-white truncate">
                  {liveStatus.nextSlot.courseCode} · {liveStatus.nextSlot.courseName}
                </p>
                <p className="text-[11px] text-white/60 flex items-center gap-1 font-mono">
                  <MapPin className="h-3 w-3 text-violet-400" /> {liveStatus.nextSlot.room} at {liveStatus.nextSlot.startTime}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-white/50">NO ACTIVE CLASS</span>
                <p className="text-xs text-white/70">All scheduled periods completed for today.</p>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/attendance"
                className="text-[11px] font-bold text-violet-300 hover:text-violet-200 transition"
              >
                Check Attendance ➔
              </Link>
              <button
                type="button"
                onClick={handlePrint}
                className="text-[11px] font-bold text-white/40 hover:text-white transition flex items-center gap-1"
              >
                <Printer className="h-3 w-3" /> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector and View Toggles */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {DAYS.map((day) => {
            const isToday = liveStatus?.todayDay === day;
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setViewMode('day');
                }}
                className={`relative rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedDay === day && viewMode === 'day'
                    ? 'bg-white text-black shadow'
                    : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Today" />
                )}
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-2xl bg-white/[0.04] p-1 border border-white/[0.08] self-end sm:self-auto">
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              viewMode === 'day' ? 'bg-violet-400 text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" /> Day View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              viewMode === 'grid' ? 'bg-violet-400 text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Full Week Matrix
          </button>
        </div>
      </div>

      {/* Main Timetable Content */}
      {viewMode === 'day' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-400" /> Schedule for {selectedDay}
              {liveStatus?.todayDay === selectedDay && (
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-500/30">
                  TODAY
                </span>
              )}
            </h2>
            <span className="text-xs font-mono text-white/40">
              {slotsForSelectedDay.length} periods scheduled
            </span>
          </div>

          <div className="space-y-3">
            {slotsForSelectedDay.map((slot, index) => {
              const isCurrent =
                liveStatus?.todayDay === selectedDay &&
                liveStatus?.currentSlot?.id === slot.id;

              const isLab = slot.type === 'Lab';
              const isTutorial = slot.type === 'Tutorial';

              return (
                <div
                  key={slot.id}
                  className={`relative rounded-2xl border p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'border-emerald-500/50 bg-emerald-500/[0.06] shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                      : 'border-white/[0.08] bg-[#121215] hover:border-white/20'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-3 right-3 sm:static">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 text-black text-[10px] font-black px-2.5 py-0.5 shadow">
                        <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping" /> IN SESSION NOW
                      </span>
                    </div>
                  )}

                  <div className="flex items-start sm:items-center gap-4">
                    {/* Time Pill */}
                    <div className="shrink-0 flex flex-col items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 w-28 text-center">
                      <span className="font-mono text-xs font-extrabold text-violet-300">
                        {slot.startTime}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">to {slot.endTime}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-white">
                          {slot.courseCode}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            isLab
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : isTutorial
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {slot.type}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white/90">{slot.courseName}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 pt-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-white/70">
                          <MapPin className="h-3 w-3 text-violet-400" /> {slot.room}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-[11px] text-white/60">Faculty: {slot.faculty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Link
                      href={`/explore?q=${encodeURIComponent(slot.courseCode)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-violet-300 hover:text-violet-200 transition bg-violet-400/10 hover:bg-violet-400/20 border border-violet-400/30 rounded-xl px-3 py-1.5"
                    >
                      <BookOpen className="h-3.5 w-3.5" /> Notes & Labs
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Week Matrix Grid View */
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#121215] p-4">
          <table className="w-full min-w-[700px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 font-mono text-[11px]">
                <th className="py-3 px-3 text-left w-24">Day</th>
                <th className="py-3 px-2 text-left">P1 (09:00)</th>
                <th className="py-3 px-2 text-left">P2 (10:00)</th>
                <th className="py-3 px-2 text-left">P3 (11:15)</th>
                <th className="py-3 px-2 text-left">P4 (12:15)</th>
                <th className="py-3 px-2 text-left">P5 (02:00)</th>
                <th className="py-3 px-2 text-left">P6 (03:00)</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const daySlots = timetable?.slots.filter((s) => s.day === day) || [];
                const isToday = liveStatus?.todayDay === day;

                return (
                  <tr
                    key={day}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${
                      isToday ? 'bg-violet-500/[0.05]' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>{day.slice(0, 3)}</span>
                        {isToday && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                      </div>
                    </td>
                    {[0, 1, 2, 3, 4, 5].map((periodIdx) => {
                      const slot = daySlots[periodIdx];
                      if (!slot) {
                        return (
                          <td key={periodIdx} className="py-2 px-2 text-white/20 italic">
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={periodIdx} className="py-2 px-2">
                          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 space-y-0.5">
                            <span className="font-mono text-[10px] font-extrabold text-violet-300 block">
                              {slot.courseCode}
                            </span>
                            <span className="text-[10px] text-white/80 block line-clamp-1">
                              {slot.courseName}
                            </span>
                            <span className="text-[9px] font-mono text-white/40 block">
                              {slot.room.split(' ')[0]}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
