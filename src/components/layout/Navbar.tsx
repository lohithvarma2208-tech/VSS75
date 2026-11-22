'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, Bookmark, ChevronDown, Compass, Home, LayoutDashboard,
  LogIn, LogOut, Plus, Settings, Upload, UserRound,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';

const desktopLinks = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'Requests', href: '/requests' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

export default function Navbar() {
  const pathname = usePathname();
  const {
    currentUser, logout, notifications, unreadNotificationCount,
    markNotificationRead, markAllNotificationsRead,
  } = useApp();
  const [panel, setPanel] = useState<'notifications' | 'account' | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) setPanel(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const mobileLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Share', href: '/upload', icon: Plus, primary: true },
    { label: 'Saved', href: '/saved', icon: Bookmark },
    { label: currentUser ? 'Settings' : 'Sign in', href: currentUser ? '/settings' : '/auth/login', icon: currentUser ? Settings : UserRound },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#09090b]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-7">
          <Link href="/" className="flex items-center gap-2.5" aria-label="VSS home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[13px] font-black tracking-[-0.08em] text-black">VS</span>
            <span className="text-[15px] font-extrabold tracking-[-0.03em]">Virtual Student Space</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.035] p-1 md:flex">
            {desktopLinks.map((item) => (
              <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-xs font-bold transition ${active(item.href) ? 'bg-white text-black' : 'text-white/55 hover:text-white'}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div ref={shellRef} className="relative flex items-center gap-2">
            <Link href="/upload" className="hidden items-center gap-2 rounded-full bg-violet-400 px-4 py-2.5 text-xs font-extrabold text-black transition hover:bg-violet-300 sm:inline-flex">
              <Upload className="h-3.5 w-3.5" /> Share
            </Link>

            {currentUser && (
              <button onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')} className="relative grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/65 hover:text-white" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unreadNotificationCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-400" />}
              </button>
            )}

            {currentUser ? (
              <button onClick={() => setPanel(panel === 'account' ? null : 'account')} className="flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1 pl-1 pr-3 text-xs font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-500 text-xs font-black text-black">{currentUser.username.charAt(0).toUpperCase()}</span>
                <ChevronDown className="h-3 w-3 text-white/45" />
              </button>
            ) : (
              <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2.5 text-xs font-extrabold text-black">
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </Link>
            )}

            {panel === 'notifications' && (
              <div className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#17171a] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <p className="text-sm font-extrabold">Notifications</p>
                  {unreadNotificationCount > 0 && <button onClick={markAllNotificationsRead} className="text-[11px] font-bold text-violet-300">Mark all read</button>}
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length === 0 ? <p className="px-3 py-8 text-center text-xs text-white/35">You&apos;re all caught up.</p> : notifications.map((item) => (
                    <button key={item.id} onClick={() => markNotificationRead(item.id)} className="w-full rounded-2xl px-3 py-3 text-left hover:bg-white/[0.05]">
                      <span className="flex items-center gap-2 text-xs font-bold">{!item.is_read && <i className="h-1.5 w-1.5 rounded-full bg-violet-400" />}{item.title}</span>
                      <span className="mt-1 block line-clamp-2 text-[11px] leading-relaxed text-white/45">{item.message}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {panel === 'account' && currentUser && (
              <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-3xl border border-white/10 bg-[#17171a] p-2 shadow-2xl">
                <div className="px-3 py-3">
                  <p className="text-sm font-extrabold">{currentUser.full_name}</p>
                  <p className="mt-0.5 text-[11px] text-white/40">{currentUser.department} · {currentUser.semester}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-1">
                  <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" close={() => setPanel(null)} />
                  <MenuLink href={`/profile/${currentUser.username}`} icon={UserRound} label="Profile" close={() => setPanel(null)} />
                  <MenuLink href="/saved" icon={Bookmark} label="Saved resources" close={() => setPanel(null)} />
                  <MenuLink href="/settings" icon={Settings} label="Settings" close={() => setPanel(null)} />
                </div>
                <button onClick={() => { logout(); setPanel(null); }} className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-xs font-bold text-rose-300 hover:bg-rose-400/10">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[25rem] -translate-x-1/2 items-center justify-around rounded-[1.8rem] border border-white/10 bg-[#18181b]/92 px-2 py-2 shadow-[0_20px_70px_rgba(0,0,0,.65)] backdrop-blur-2xl md:hidden" aria-label="Mobile navigation">
        {mobileLinks.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[9px] font-bold transition ${item.primary ? '-mt-7' : active(item.href) ? 'text-white' : 'text-white/40'}`}>
            <span className={`grid place-items-center ${item.primary ? 'h-12 w-12 rounded-full bg-violet-400 text-black shadow-[0_8px_30px_rgba(167,139,250,.35)]' : 'h-6 w-6'}`}><Icon className={item.primary ? 'h-5 w-5' : 'h-[18px] w-[18px]'} /></span>
            {item.label}
          </Link>;
        })}
      </nav>
    </>
  );
}

function MenuLink({ href, icon: Icon, label, close }: { href: string; icon: typeof Home; label: string; close: () => void }) {
  return <Link href={href} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/65 transition hover:bg-white/[0.06] hover:text-white"><Icon className="h-4 w-4" />{label}</Link>;
}
