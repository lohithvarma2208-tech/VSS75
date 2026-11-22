'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  X,
  FileCheck2,
  Crown,
  ShieldCheck,
  UserCheck,
  Flame,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';

export default function CampusBenefitsAdModal() {
  const { isBenefitsAdOpen, closeBenefitsAd, currentUser } = useApp();
  const router = useRouter();

  // Strictly only display when the ad is open AND the user is signed in
  if (!isBenefitsAdOpen || !currentUser) return null;

  const handleStartContributing = () => {
    closeBenefitsAd();
    router.push('/upload');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#131B2E] via-[#0D1527] to-[#070A11] border border-purple-500/40 shadow-2xl shadow-purple-950/70 p-6 text-white">
        {/* Quick Close 'X' */}
        <button
          onClick={closeBenefitsAd}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Short & Sweet Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-extrabold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-amber-300" />
            VIP Scholar Perks
          </span>
          <span className="text-[10px] text-white/40 font-mono">
            • @{currentUser?.username || 'scholar'}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
          Why Stay Active on{' '}
          <span className="bg-gradient-to-r from-[#D8B4FE] to-[#38BDF8] bg-clip-text text-transparent">
            VSS?
          </span>
        </h3>
        <p className="text-xs text-white/60 mb-4">
          5 exclusive privileges unlocked for active campus contributors:
        </p>

        {/* 5 Short & Sweet Perks (Compact List) */}
        <div className="space-y-2 mb-5 text-xs">
          {/* Perk 1: PDF Studio */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F19]/80 border border-purple-500/20 hover:border-purple-400/50 transition">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-[#38BDF8] shrink-0">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <span className="font-bold text-white truncate">
                <strong className="text-purple-200">PDF Studio Pro:</strong> Merge, sign & watermark
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                5 Posts/Wk
              </span>
            </div>
          </div>

          {/* Perk 2: Academic Head Positions */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F19]/80 border border-amber-500/20 hover:border-amber-400/50 transition">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <span className="font-bold text-white truncate">
                <strong className="text-amber-200">Academic Head Titles:</strong> Top Hall of Fame
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                Top 3
              </span>
            </div>
          </div>

          {/* Perk 3: Pioneer Protection */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F19]/80 border border-cyan-500/20 hover:border-cyan-400/50 transition">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <span className="font-bold text-white truncate">
                <strong className="text-cyan-200">Pioneer Shield:</strong> Duplicates eliminated
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-[#38BDF8] border border-cyan-500/30 shrink-0">
                Protected
              </span>
            </div>
          </div>

          {/* Perk 4: 100% Privacy */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F19]/80 border border-indigo-500/20 hover:border-indigo-400/50 transition">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
              <UserCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <span className="font-bold text-white truncate">
                <strong className="text-indigo-200">Privacy:</strong> Anonymous sharing
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30 shrink-0">
                Zero Roll Nos
              </span>
            </div>
          </div>

          {/* Perk 5: Exam Survival Packs */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F19]/80 border border-rose-500/20 hover:border-rose-400/50 transition">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 shrink-0">
              <Flame className="h-4 w-4 text-rose-400" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <span className="font-bold text-white truncate">
                <strong className="text-rose-200">Exam Packs:</strong> PYQs & quick sharing
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                Instant
              </span>
            </div>
          </div>
        </div>

        {/* Short & Sweet Action Row */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <button
            onClick={closeBenefitsAd}
            className="text-xs font-semibold text-white/50 hover:text-white transition px-2 py-1"
          >
            Dismiss
          </button>

          <button
            onClick={handleStartContributing}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-xs font-extrabold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <span>Upload Work (+100 XP)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
