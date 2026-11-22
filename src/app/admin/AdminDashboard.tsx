'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck, CalendarDays, Eye, EyeOff, GraduationCap, KeyRound,
  LockKeyhole, Search, ShieldCheck, UserCheck, Users,
} from 'lucide-react';

interface UserRecord {
  registrationNumber: string;
  name: string;
  department: string;
  semester?: string;
  academicYear?: string;
  courses: { code: string; name: string; semester?: string }[];
  firstLoginAt: string;
  lastLoginAt: string;
  loginCount: number;
}

export default function AdminDashboard({ administrator }: { administrator: { name: string; registrationNumber: string } }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [showNumbers, setShowNumbers] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load users.');
        setUsers(data.users || []);
      })
      .catch((failure) => setError(failure instanceof Error ? failure.message : 'Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return users;
    return users.filter((user) => `${user.name} ${user.registrationNumber} ${user.department} ${user.semester || ''}`.toLowerCase().includes(value));
  }, [users, query]);

  const courseCount = new Set(users.flatMap((user) => user.courses.map((course) => course.code))).size;
  const mask = (value: string) => showNumbers ? value : `${value.slice(0, 2)}••••${value.slice(-2)}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-7 sm:py-11">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="vss-kicker">Private control room</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">Admin</h1><p className="mt-2 text-xs text-white/35">Signed in as {administrator.name} · {administrator.registrationNumber}</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-2 text-[10px] font-bold text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Server-authorized ERP session</span>
      </div>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Users} value={users.length} label="Verified users" />
        <Metric icon={BookOpenCheck} value={courseCount} label="Course codes" />
        <Metric icon={UserCheck} value={users.reduce((sum, user) => sum + user.loginCount, 0)} label="Verified logins" />
        <Metric icon={LockKeyhole} value={0} label="Passwords stored" />
      </section>

      <section className="mt-7 rounded-[1.6rem] border border-amber-300/15 bg-amber-300/[0.045] p-4">
        <div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><div><h2 className="text-xs font-extrabold">Password isolation is enforced</h2><p className="mt-1 text-[10px] leading-5 text-white/38">ERP passwords are sent only for the immediate ERP verification request, then discarded. They are never written to Supabase, logs, browser storage, or this dashboard.</p></div></div>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="vss-kicker">User registry</p><h2 className="mt-1 text-xl font-extrabold">Verified accounts</h2></div><button onClick={() => setShowNumbers(!showNumbers)} className="vss-button-secondary px-4 py-2.5 text-[10px]">{showNumbers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{showNumbers ? 'Mask registration numbers' : 'Show registration numbers'}</button></div>
        <div className="relative mt-4"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="profile-input pl-11" placeholder="Search name, registration number, department or semester" /></div>

        {error ? <div className="vss-card mt-4 p-5 text-xs text-rose-300">{error}</div> : loading ? <div className="vss-card mt-4 p-8 text-center text-xs text-white/35">Loading private registry…</div> : filtered.length === 0 ? <div className="vss-card mt-4 p-8 text-center text-xs text-white/35">No verified users found.</div> : <div className="mt-4 grid gap-3 md:grid-cols-2">{filtered.map((user) => (
          <button key={user.registrationNumber} onClick={() => setSelected(user)} className="vss-card vss-card-hover flex items-center gap-3 p-4 text-left"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-400 text-sm font-black text-black">{user.name.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{user.name}</b><small className="mt-1 block truncate font-mono text-[9px] text-white/35">{mask(user.registrationNumber)} · {user.department || 'Department unavailable'}</small></span><span className="text-[9px] text-white/25">{user.loginCount} logins</span></button>
        ))}</div>}
      </section>

      {selected && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setSelected(null)}><section onClick={(event) => event.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#17171a] p-5 sm:rounded-[2rem] sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="vss-kicker">User details</p><h2 className="mt-1 text-xl font-extrabold">{selected.name}</h2></div><button onClick={() => setSelected(null)} className="text-xs font-bold text-white/40">Close</button></div><dl className="mt-6 space-y-1"><Detail icon={KeyRound} label="Registration number" value={selected.registrationNumber} /><Detail icon={GraduationCap} label="Department & semester" value={`${selected.department || 'Unavailable'} · ${selected.semester || 'Unavailable'}`} /><Detail icon={CalendarDays} label="Last verified login" value={new Date(selected.lastLoginAt).toLocaleString()} /><Detail icon={UserCheck} label="Login count" value={String(selected.loginCount)} /><Detail icon={LockKeyhole} label="ERP password" value="Not stored by VSS" /></dl><div className="mt-6"><p className="vss-kicker">Registered courses</p><div className="mt-3 space-y-2">{selected.courses.length ? selected.courses.map((course) => <div key={course.code} className="rounded-2xl bg-white/[0.035] px-3 py-3"><b className="font-mono text-[10px] text-violet-300">{course.code}</b><p className="mt-1 text-[10px] text-white/55">{course.name}</p></div>) : <p className="text-[10px] text-white/30">ERP did not expose course rows for this login.</p>}</div></div></section></div>}
    </main>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) { return <div className="vss-card p-4 sm:p-5"><Icon className="h-4 w-4 text-violet-300" /><b className="mt-4 block text-xl font-extrabold">{value}</b><small className="mt-1 block text-[9px] text-white/30">{label}</small></div>; }
function Detail({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl px-2 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05]"><Icon className="h-4 w-4 text-violet-300" /></span><span><dt className="text-[9px] text-white/30">{label}</dt><dd className="mt-0.5 text-xs font-bold">{value}</dd></span></div>; }
