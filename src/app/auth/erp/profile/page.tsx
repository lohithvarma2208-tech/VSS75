import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BadgeCheck, Building2, GraduationCap, Hash, Settings, CalendarCheck, Clock, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import SignOutButton from './SignOutButton';

export default async function ErpProfilePage() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  const profile = id ? await getErpSession(id) : null;
  if (!profile) redirect('/auth/login');

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10 sm:py-14">
      <div className="text-center">
        <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-500 text-2xl font-black text-black">{profile.name.charAt(0).toUpperCase()}<BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#09090b] p-1 text-violet-300" /></div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{profile.name}</h1>
        <p className="mt-1 font-mono text-[11px] text-white/35">{profile.rollNumber}</p>
      </div>

      <section className="vss-card mt-8 overflow-hidden p-2">
        <ProfileRow icon={GraduationCap} label="Student" value="Verified KL profile" />
        <ProfileRow icon={Hash} label="Roll number" value={profile.rollNumber} />
        {profile.department && <ProfileRow icon={Building2} label="Department" value={profile.department} />}
      </section>

      <section className="vss-card mt-4 p-2 space-y-1">
        <Link href="/attendance" className="flex items-center gap-3 rounded-2xl px-3 py-3.5 hover:bg-white/[0.04]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <b className="block text-xs font-bold">Attendance Checker</b>
            <small className="block text-[10px] text-white/35">View course attendance & safe bunks</small>
          </span>
          <span className="text-white/25">›</span>
        </Link>
        <Link href="/timetable" className="flex items-center gap-3 rounded-2xl px-3 py-3.5 hover:bg-white/[0.04]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
            <Clock className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <b className="block text-xs font-bold">Class Timetable</b>
            <small className="block text-[10px] text-white/35">Live schedule, period slots & classrooms</small>
          </span>
          <span className="text-white/25">›</span>
        </Link>
        <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-3 py-3.5 hover:bg-white/[0.04]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05]">
            <LayoutDashboard className="h-4 w-4" />
          </span>
          <span className="flex-1 text-xs font-bold">Student Dashboard</span>
          <span className="text-white/25">›</span>
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-3.5 hover:bg-white/[0.04]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05]">
            <Settings className="h-4 w-4" />
          </span>
          <span className="flex-1 text-xs font-bold">VSS settings</span>
          <span className="text-white/25">›</span>
        </Link>
      </section>

      <div className="mt-6"><SignOutButton /></div>
    </main>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl px-3 py-3.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-violet-300"><Icon className="h-4 w-4" /></span><span className="flex-1"><b className="block text-xs">{label}</b><small className="mt-0.5 block text-[10px] text-white/35">{value}</small></span></div>;
}
