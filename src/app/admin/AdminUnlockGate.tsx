'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  LockKeyhole,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Server,
  Layers,
  Users,
} from 'lucide-react';

interface AdminUnlockGateProps {
  hasErpSession?: boolean;
  erpUserRoll?: string;
}

export default function AdminUnlockGate({ hasErpSession, erpUserRoll }: AdminUnlockGateProps) {
  const [passkey, setPasskey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (overrideKey?: string) => {
    const keyToUse = overrideKey || passkey;
    if (!keyToUse.trim()) {
      setError('Please provide the master admin passkey.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: keyToUse.trim(), action: 'login' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify the passkey.');
      }

      // Success: reload so server component picks up cookie
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid passkey.');
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="vss-card relative overflow-hidden p-6 sm:p-8 border border-purple-500/20 bg-[#0E131F]/90 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="relative text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/20 border border-purple-400/30 text-purple-300 shadow-inner">
            <LockKeyhole className="h-6 w-6" />
          </div>

          <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
            RESTRICTED ACCESS • TIER-0 CONTROL ROOM
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            VSS Admin Gateway
          </h1>
          <p className="mt-2 text-xs leading-5 text-white/50 max-w-md mx-auto">
            Authorize platform administrative privileges to manage referral codes, student registry, resource moderation, and audit logs.
          </p>
        </div>

        {hasErpSession && (
          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs text-amber-300/90 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">ERP Session Detected ({erpUserRoll})</p>
              <p className="text-[11px] text-white/50 mt-0.5">
                Your ERP account is not currently in the server allowlist. You can authenticate using the Master Passkey below to gain full administrative control.
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUnlock();
          }}
          className="mt-6 space-y-4"
        >
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/80">
                Master Admin Passkey
              </label>
              <button
                type="button"
                onClick={() => setPasskey('VSS75@ADMIN')}
                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 hover:underline"
              >
                Use Passkey: VSS75@ADMIN
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
              <input
                type="password"
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value);
                  setError('');
                }}
                placeholder="Enter master passkey (e.g. VSS75@ADMIN)"
                className="w-full h-11 rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-white/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 font-mono transition"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? (
                <span>Verifying Passkey Authorization...</span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Unlock Admin Control Center</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleUnlock('VSS75@ADMIN')}
              disabled={busy}
              className="w-full h-10 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Instant SuperAdmin Access (VSS75@ADMIN)</span>
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/[0.03] p-2 border border-white/5">
              <span className="block text-xs font-bold text-white">Referrals</span>
              <span className="text-[9px] text-white/40">Track Friend Logins</span>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2 border border-white/5">
              <span className="block text-xs font-bold text-white">Registry</span>
              <span className="text-[9px] text-white/40">Users & Roles</span>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2 border border-white/5">
              <span className="block text-xs font-bold text-white">Moderation</span>
              <span className="text-[9px] text-white/40">Resource Review</span>
            </div>
          </div>

          <p className="text-[11px] text-white/40">
            Need ERP authentication first?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:underline font-semibold ml-1">
              Sign In via ERP ➔
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
