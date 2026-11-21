'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  UploadCloud,
  ShieldCheck,
  Award,
  Sparkles,
  Users,
  Layers,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CAMPUS_ACADEMIC_HEADS, CampusAcademicLeader } from '@/lib/data/academic-heads';
import { useApp } from '@/lib/context/AppContext';
import BackgroundVideo from '@/components/common/BackgroundVideo';

export default function LeaderboardPage() {
  const { currentUser } = useApp();
  const [selectedDept, setSelectedDept] = useState<'ALL' | 'CSE' | 'AI&DS' | 'ECE' | 'CS&IT'>('ALL');

  const filteredLeaders = CAMPUS_ACADEMIC_HEADS.filter(
    (h) => selectedDept === 'ALL' || h.department === selectedDept
  );

  const top3 = CAMPUS_ACADEMIC_HEADS.slice(0, 3);

  return (
    <div className="px-6 sm:px-12 lg:px-16 py-10 space-y-10 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-[2.5rem] border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#131B2E] to-indigo-950/40 p-8 sm:p-10 text-white shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Background "The Vault of Knowledge" - Cinematic Master Loop */}
        <BackgroundVideo src="/videos/vault-of-knowledge.mp4" opacity={0.85} overlayStyle="obsidian" />

        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-bold uppercase tracking-wider font-mono border border-purple-500/30">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>Campus Academic Council • Weekly Hall of Fame</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-mono">
              Academic Heads Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
              Official roster of appointed student academic leads. Every user receives a unique operational <span className="text-[#38BDF8] font-mono font-bold">[CODE_NAME]</span> and campus position based on verified weekly contributions.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% Student Privacy Shield: Roll numbers &amp; real names are permanently hidden.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/upload"
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Share Work (+100 XP)</span>
            </Link>
            <Link
              href="/requests"
              className="px-5 py-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Peer Requests</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Department Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-400" />
            <span>Council Positions by Department</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Filter appointed academic heads across KLEF engineering branches.
          </p>
        </div>

        <div className="flex items-center bg-[#131B2E] p-1.5 rounded-full border border-white/10 text-xs font-mono overflow-x-auto custom-scrollbar">
          {(['ALL', 'CSE', 'AI&DS', 'ECE', 'CS&IT'] as const).map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-4 py-1.5 rounded-full transition font-bold whitespace-nowrap ${
                selectedDept === dept
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {dept === 'ALL' ? '🌐 All Branches' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top3.map((leader) => {
          const isGold = leader.rank === 1;
          const isSilver = leader.rank === 2;
          const borderGlow = isGold
            ? 'border-amber-500/50 hover:border-amber-400 bg-gradient-to-b from-amber-500/15 via-[#131B2E] to-[#0D1527]'
            : isSilver
            ? 'border-slate-400/40 hover:border-slate-300 bg-gradient-to-b from-slate-400/15 via-[#131B2E] to-[#0D1527]'
            : 'border-amber-700/40 hover:border-amber-600 bg-gradient-to-b from-amber-700/15 via-[#131B2E] to-[#0D1527]';

          const badgeBg = isGold
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : isSilver
            ? 'bg-slate-400/20 text-slate-200 border-slate-400/30'
            : 'bg-amber-700/20 text-amber-200 border-amber-700/30';
          const iconMedal = isGold ? '🥇' : isSilver ? '🥈' : '🥉';

          return (
            <div
              key={leader.code_name}
              className={`rounded-[2.5rem] border p-6 sm:p-7 shadow-xl relative overflow-hidden group transition-all ${borderGlow}`}
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className={`px-2.5 py-0.5 rounded-full border font-mono text-[10px] font-bold ${badgeBg}`}>
                  {leader.rank === 1 ? '👑 RANK #1' : leader.rank === 2 ? '🥈 RANK #2' : '🥉 RANK #3'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[#38BDF8] tracking-wider">
                  [{leader.code_name}]
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-black/40 border border-white/10 text-2xl flex items-center justify-center shadow-lg shrink-0">
                  {iconMedal}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white font-mono tracking-wide">
                    @{leader.username}
                  </h3>
                  <p className="text-[11px] text-[#D8B4FE] font-mono font-bold mt-0.5">
                    {leader.academic_position}
                  </p>
                  <p className="text-[10px] text-white/50 font-mono mt-1">
                    {leader.department} ({leader.semester}) • Verified Scholar
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-white/70 italic mt-3 line-clamp-1">
                Focus: {leader.specialization}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-xl font-black text-amber-300">{leader.weekly_posts}</span>
                  <p className="text-[10px] text-white/50 uppercase">Posts This Wk</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-xl font-black text-[#38BDF8]">{leader.total_downloads}</span>
                  <p className="text-[10px] text-white/50 uppercase">Downloads</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <span>Status:</span>
                <span className="font-bold">✓ PDF Studio Unlocked</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Appointed Council Table */}
      <div className="rounded-[2.5rem] bg-[#131B2E]/80 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-4 gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              Appointed Academic Heads Council ({filteredLeaders.length} Leaders)
            </h3>
            <p className="text-[11px] text-white/50">
              Department leads overseeing peer-review, syllabus integrity, and weekly uploads.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#D8B4FE] bg-purple-500/15 border border-purple-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
            KLEF Academic Registry
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Unique Code Name</th>
                <th className="pb-3">Unique Username</th>
                <th className="pb-3">Campus Academic Head Position</th>
                <th className="pb-3">Dept &amp; Term</th>
                <th className="pb-3 text-center">Weekly Posts</th>
                <th className="pb-3 text-right pr-2">Impact (Downloads)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaders.map((leader) => (
                <tr key={leader.code_name} className="hover:bg-white/5 transition-colors font-medium">
                  <td className="py-3.5 pl-2 font-mono font-black text-amber-300">
                    #{leader.rank}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[#38BDF8] font-mono font-bold text-[11px] tracking-wider">
                      [{leader.code_name}]
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="font-bold text-white font-mono">@{leader.username}</div>
                    <div className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                      <span>●</span> Verified Scholar
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-purple-300 text-xs font-semibold">
                    {leader.academic_position}
                  </td>
                  <td className="py-3.5 font-mono text-white/70 text-[11px]">
                    {leader.department} ({leader.semester})
                  </td>
                  <td className="py-3.5 text-center font-mono">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/20">
                      {leader.weekly_posts}
                    </span>
                  </td>
                  <td className="py-3.5 text-right pr-2 font-mono text-[#38BDF8] font-bold">
                    {leader.total_downloads.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainer Box: How Academic Positions Work */}
      <div className="rounded-[2.5rem] border border-white/10 bg-[#0F172A]/70 p-6 sm:p-8 backdrop-blur-md">
        <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-amber-400" />
          <span>How Campus Academic Positions Work</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/70 font-sans leading-relaxed">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <h4 className="font-bold text-white font-mono flex items-center gap-1.5">
              <span>1. Pioneer Uploads (+100 XP)</span>
            </h4>
            <p>
              Upload verified course material first to claim permanent Pioneer attribution. Each verified upload adds +100 XP toward your weekly academic rank.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <h4 className="font-bold text-white font-mono flex items-center gap-1.5">
              <span>2. Peer Exchange (+50 XP)</span>
            </h4>
            <p>
              Help peer students by fulfilling resource requests on the Requests board. Accepted offers award +50 XP and boost your department reputation.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <h4 className="font-bold text-white font-mono flex items-center gap-1.5">
              <span>3. 100% Student Privacy Shield</span>
            </h4>
            <p>
              Your official KL ERP ID is authenticated securely, but never shown publicly. You operate purely under your unique Code Name and anonymous username.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
