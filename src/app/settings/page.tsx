'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell, Bookmark, ChevronRight, CircleHelp, FileText, LogIn,
  LogOut, Moon, ShieldCheck, Sparkles, Upload, UserRound, CalendarRange, BookOpenCheck,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { getRelevantCourses, readAcademicContext, saveAcademicContext, TERM_OPTIONS, type AcademicContext } from '@/lib/academic-context';

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, logout, openVerifyModal } = useApp();
  const [academic, setAcademic] = useState<AcademicContext | null>(null);

  useEffect(() => { setAcademic(readAcademicContext(currentUser)); }, [currentUser]);

  if (!currentUser) {
    return <main className="mx-auto max-w-xl px-5 py-16 text-center"><div className="vss-card p-8"><LogIn className="mx-auto h-7 w-7 text-violet-300" /><h1 className="mt-4 text-xl font-extrabold">Sign in to open settings</h1><p className="mt-2 text-xs text-white/40">Your profile and preferences will appear here.</p><Link href="/auth/login" className="vss-button mt-6">Sign in</Link></div></main>;
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-9 sm:py-12">
      <p className="vss-kicker">Your space</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Settings</h1>

      <section className="mt-7 flex items-center gap-4 px-1">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-500 text-xl font-black text-black">{currentUser.username.charAt(0).toUpperCase()}</span>
        <span className="min-w-0 flex-1"><b className="block truncate text-lg font-extrabold">{currentUser.full_name}</b><small className="mt-1 block truncate font-mono text-[10px] text-white/35">@{currentUser.username} · {currentUser.department}</small></span>
        <Link href={`/profile/${currentUser.username}`} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold text-white/55 hover:text-white">View</Link>
      </section>

      <SettingsGroup title="Account">
        <SettingsRow icon={UserRound} title="Profile" subtitle="Name, bio and department" href={`/profile/${currentUser.username}`} />
        <SettingsRow icon={ShieldCheck} title="Campus verification" subtitle={currentUser.is_verified_student ? 'Verified student' : 'Verify your student access'} action={openVerifyModal} accent />
        <SettingsRow icon={Bell} title="Notifications" subtitle="Activity and community updates" href="/dashboard" />
      </SettingsGroup>

      {academic && <section className="mt-8">
        <h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Academic context</h2>
        <div className="vss-card p-4">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-400 text-black"><CalendarRange className="h-4 w-4" /></span><span><b className="block text-xs">Current semester</b><small className="mt-0.5 block text-[10px] leading-4 text-white/35">ERP is used when available. You can override it here.</small></span></div>
          <select value={academic.semester} onChange={(event) => {
            const next = { ...academic, semester: event.target.value, source: 'manual' as const, userId: currentUser.id };
            setAcademic(next); saveAcademicContext(next); setCurrentUser({ ...currentUser, semester: next.semester, academic_context_source: 'manual' });
          }} className="profile-input mt-4 appearance-none">
            {TERM_OPTIONS.map((term) => <option key={term} value={term} className="bg-[#17171a]">{term}</option>)}
          </select>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/[0.035] px-3 py-3 text-[10px] text-white/40"><BookOpenCheck className="h-4 w-4 shrink-0 text-violet-300" /><span>{getRelevantCourses(currentUser, academic.semester).length} relevant courses available for {academic.semester}</span></div>
        </div>
      </section>}

      <SettingsGroup title="Student tools">
        <SettingsRow icon={Bookmark} title="Saved resources" subtitle="Your reading list" href="/saved" />
        <SettingsRow icon={Upload} title="Your contributions" subtitle="Resources shared with VSS" href="/dashboard" />
        <SettingsRow icon={FileText} title="PDF Studio" subtitle="Prepare clean study material" href="/pdf-studio" />
      </SettingsGroup>

      <SettingsGroup title="App">
        <SettingsRow icon={Moon} title="Appearance" subtitle="Dark mode · System default" />
        <SettingsRow icon={Sparkles} title="About VSS" subtitle="Built by KLU students" href="/" />
        <SettingsRow icon={CircleHelp} title="Help & requests" subtitle="Ask the community" href="/requests" />
      </SettingsGroup>

      <button onClick={() => { logout(); router.push('/'); }} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] px-4 py-3.5 text-xs font-bold text-rose-300 hover:bg-rose-400/10"><LogOut className="h-4 w-4" /> Sign out</button>
      <p className="mt-6 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">VSS · Virtual Student Space</p>
    </main>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-8"><h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">{title}</h2><div className="vss-card overflow-hidden p-1.5">{children}</div></section>;
}

function SettingsRow({ icon: Icon, title, subtitle, href, action, accent }: { icon: typeof UserRound; title: string; subtitle: string; href?: string; action?: () => void; accent?: boolean }) {
  const content = <><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${accent ? 'bg-violet-400 text-black' : 'bg-white/[0.05] text-white/65'}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><b className="block text-xs">{title}</b><small className="mt-0.5 block truncate text-[10px] text-white/32">{subtitle}</small></span>{(href || action) && <ChevronRight className="h-4 w-4 text-white/20" />}</>;
  const className = 'flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.035]';
  if (href) return <Link href={href} className={className}>{content}</Link>;
  if (action) return <button type="button" onClick={action} className={className}>{content}</button>;
  return <div className={className}>{content}</div>;
}
