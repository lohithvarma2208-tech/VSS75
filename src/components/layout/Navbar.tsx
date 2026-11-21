'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  User,
  ShieldAlert,
  Bookmark,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    switchDemoUser,
    logout,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    openVerifyModal,
    openBenefitsAd,
  } = useApp();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const weeklyUploads = currentUser
    ? MockStorageManager.getWeeklyUploadCount(currentUser.id, currentUser.full_name, currentUser.username)
    : 0;
  const isStudioUnlocked = weeklyUploads >= 5;

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Explore', href: '/explore' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Requests', href: '/requests' },
    { label: 'PDF Studio', href: '/pdf-studio' },
  ];

  return (
    <header className="w-full bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 lg:px-12 py-3.5 relative z-40">
      <div className="flex items-center justify-between gap-6 w-full max-w-7xl mx-auto">
        {/* Brand Logo with Agentic Gradient Sparks */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0 select-none">
          <div className="relative flex items-center">
            {/* Playful sunburst sparks with purple-to-cyan AI gradient */}
            <div className="absolute -top-2 left-1 flex gap-0.5 opacity-90 group-hover:opacity-100 transition">
              <span className="w-0.5 h-2 bg-gradient-to-t from-[#A855F7] to-[#38BDF8] rounded-full -rotate-12" />
              <span className="w-0.5 h-2.5 bg-gradient-to-t from-[#A855F7] to-[#38BDF8] rounded-full" />
              <span className="w-0.5 h-2 bg-gradient-to-t from-[#A855F7] to-[#38BDF8] rounded-full rotate-12" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white font-sans">
              VSS
            </span>
          </div>
        </Link>

        {/* Center Nav Links - Clean, uncluttered layout */}
        <nav className="hidden md:flex items-center space-x-8 lg:space-x-10 shrink-0">
          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-xs sm:text-[13px] font-bold tracking-wide transition-colors pb-1 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#D8B4FE] to-[#38BDF8]'
                    : 'text-slate-300/80 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons: Clean single-line pill buttons - NO text wrapping */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Share Work Pill Button with explicit single-line nowrap */}
          <Link
            href="/upload"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white px-5 py-2 text-xs sm:text-[13px] font-extrabold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0 leading-none"
          >
            <span className="whitespace-nowrap">Share Work</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#38BDF8]" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-[#131B2E] border border-white/15 shadow-2xl py-3 z-50 text-white backdrop-blur-md">
                <div className="flex items-center justify-between px-5 py-2 border-b border-white/10">
                  <span className="font-bold text-xs">Campus Alerts</span>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-[#D8B4FE] hover:text-[#38BDF8] hover:underline font-bold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-white/40">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3.5 hover:bg-white/5 transition cursor-pointer ${
                          !n.is_read ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-white">{n.title}</p>
                          {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8] shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-white/60 mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Persona Profile Pill */}
          {currentUser ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 px-3 rounded-full border border-white/20 hover:border-white/40 bg-white/5 text-left transition whitespace-nowrap shrink-0"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 font-mono">
                  {(currentUser.code_name || currentUser.username).charAt(0)}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-white font-mono">
                  @{currentUser.username}
                </span>
                <ChevronDown className="h-3 w-3 text-white/60 shrink-0" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-[#131B2E] border border-white/15 shadow-2xl py-3 z-50 text-white backdrop-blur-md">
                  <div className="px-5 py-2.5 border-b border-white/10">
                    <p className="text-xs font-extrabold text-white font-mono">@{currentUser.username}</p>
                    {currentUser.code_name && (
                      <p className="text-[10px] font-mono font-bold text-[#38BDF8] tracking-wider mt-0.5">
                        [{currentUser.code_name}]
                      </p>
                    )}
                    {currentUser.academic_position && (
                      <p className="text-[10px] font-mono text-[#D8B4FE] font-semibold mt-0.5">
                        {currentUser.academic_position}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-[#D8B4FE] border border-purple-500/30 uppercase tracking-wider">
                        {currentUser.role}
                      </span>
                      {currentUser.is_verified_student ? (
                        <VerifiedBadge size="xs" />
                      ) : (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            openVerifyModal();
                          }}
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/30 transition"
                        >
                          Verify Campus Email
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        openBenefitsAd();
                      }}
                      className="w-full flex items-center justify-between px-5 py-2 hover:bg-white/10 font-bold text-left bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-transparent text-amber-200 border-b border-white/5"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        <span>Active Scholar Perks (Ad)</span>
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Benefits
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        openVerifyModal();
                      }}
                      className="w-full flex items-center justify-between px-5 py-2 text-white/80 hover:bg-white/10 font-medium text-left"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8]" />
                        Campus Verification
                      </span>
                      {currentUser.is_verified_student ? (
                        <span className="text-[10px] text-[#38BDF8] font-mono font-bold">✓ Verified</span>
                      ) : (
                        <span className="text-[10px] text-[#f59e0b] font-mono font-bold">Get Verified</span>
                      )}
                    </button>
                    <Link
                      href={`/profile/${currentUser.username}`}
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-5 py-2 text-white/80 hover:bg-white/10 font-medium"
                    >
                      <User className="h-3.5 w-3.5 text-white/50" />
                      View Profile
                    </Link>
                    <Link
                      href="/saved"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-5 py-2 text-white/80 hover:bg-white/10 font-medium"
                    >
                      <Bookmark className="h-3.5 w-3.5 text-white/50" />
                      Saved Bookmarks
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-5 py-2 text-white/80 hover:bg-white/10 font-medium"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-white/50" />
                      Student Dashboard
                    </Link>
                    <Link
                      href="/pdf-studio"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center justify-between px-5 py-2 text-white/80 hover:bg-white/10 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-[#D8B4FE]" />
                        Pro PDF Studio
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isStudioUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-[#D8B4FE]'
                      }`}>
                        {weeklyUploads}/5 this wk
                      </span>
                    </Link>
                    {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 px-5 py-2 text-amber-300 hover:bg-white/10 font-medium"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        Admin Desk
                      </Link>
                    )}
                  </div>

                  {/* Switch Demo Role Helper */}
                  <div className="border-t border-white/10 px-4 py-2.5 bg-black/20">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                      <Sparkles className="h-3 w-3 text-[#f59e0b]" /> Switch Persona
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => {
                          switchDemoUser('student');
                          setShowUserDropdown(false);
                        }}
                        className={`text-[10px] py-1 px-1.5 rounded-full font-bold text-center transition ${
                          currentUser.role === 'student'
                            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-sm'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        onClick={() => {
                          switchDemoUser('moderator');
                          setShowUserDropdown(false);
                        }}
                        className={`text-[10px] py-1 px-1.5 rounded-full font-bold text-center transition ${
                          currentUser.role === 'moderator'
                            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-sm'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Mod
                      </button>
                      <button
                        onClick={() => {
                          switchDemoUser('admin');
                          setShowUserDropdown(false);
                        }}
                        className={`text-[10px] py-1 px-1.5 rounded-full font-bold text-center transition ${
                          currentUser.role === 'admin'
                            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-sm'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-5 py-2 text-xs text-rose-400 hover:bg-rose-950/40 font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition whitespace-nowrap"
            >
              Sign In ➔
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white rounded-xl"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 mt-3 pt-3 space-y-2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-bold text-white/80 hover:text-white rounded-lg hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-xs font-bold text-white/80 hover:text-white rounded-lg hover:bg-white/5"
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-extrabold text-xs shadow-md shadow-indigo-500/25"
          >
            Share Work ↗
          </Link>
        </div>
      )}
    </header>
  );
}
