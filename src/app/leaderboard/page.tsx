'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  UploadCloud,
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CAMPUS_ACADEMIC_HEADS } from '@/lib/data/academic-heads';
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
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
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
              {dept === 'ALL' ? 'All Branches' : dept}
            </button>
          ))}
        </div>
      </div>

      {filteredLeaders.length === 0 ? (
        <div className="p-16 text-center rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/50">
          <Trophy className="h-12 w-12 text-amber-400/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-mono">No Academic Leaderboard Rankings Yet</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto mt-1 mb-6 leading-relaxed font-sans">
            Rankings and appointed council positions update automatically when verified students upload course notes, lab records, and help peers.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload First Resource</span>
          </Link>
        </div>
      ) : (
        <>
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

              return (
                <div
                  key={leader.code_name}
                  className={`rounded-[2.5rem] border p-6 sm:p-7 shadow-xl relative overflow-hidden group transition-all ${borderGlow}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full border font-mono text-[10px] font-bold ${badgeBg}`}>
                      RANK #{leader.rank}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[#38BDF8] tracking-wider">
                      [{leader.code_name}]
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-lg shrink-0">
                      <Award className={`h-5 w-5 ${isGold ? 'text-amber-300' : isSilver ? 'text-slate-200' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white font-mono tracking-wide">
                        @{leader.username}
                      </h3>
                      <p className="text-[11px] text-[#D8B4FE] font-mono font-bold mt-0.5">
                        {leader.academic_position.replace(/^[^A-Za-z0-9]+/, '')}
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
                    <span className="inline-flex items-center gap-1 font-bold"><CheckCircle2 className="h-3.5 w-3.5" /> PDF Studio Unlocked</span>
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
                    <th className="pb-3">Appointed Position</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Weekly Uploads</th>
                    <th className="pb-3">Total Downloads</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredLeaders.map((leader) => (
                    <tr
                      key={leader.code_name}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="py-4 pl-2 font-bold text-white/80">
                        #{leader.rank}
                      </td>
                      <td className="py-4">
                        <span className="text-[#38BDF8] font-bold">
                          [{leader.code_name}]
                        </span>
                      </td>
                      <td className="py-4 text-[#D8B4FE]">
                        {leader.academic_position.replace(/^[^A-Za-z0-9]+/, '')}
                      </td>
                      <td className="py-4 text-white/70">
                        {leader.department}
                      </td>
                      <td className="py-4 text-amber-300 font-bold">
                        {leader.weekly_posts}
                      </td>
                      <td className="py-4 text-white/80">
                        {leader.total_downloads}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <Link
                          href={`/profile/${leader.username}`}
                          className="text-[11px] text-purple-400 hover:text-purple-300 font-bold"
                        >
                          View ➔
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Council Criteria & FAQ */}
      <div className="rounded-[2.5rem] border border-white/10 bg-[#0B0F19]/60 p-6 sm:p-8 backdrop-blur-md">
        <h3 className="text-sm font-extrabold text-white font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Academic Council Appointment Criteria &amp; XP System</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/70 leading-relaxed font-sans">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <h4 className="font-bold text-white font-mono flex items-center gap-1.5">
              <span>1. Verified Uploads (+100 XP)</span>
            </h4>
            <p>
              Upload authentic lab records, previous semester question papers, or unit lecture notes. Each approved upload grants +100 XP towards council rank.
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
