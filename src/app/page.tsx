'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  UploadCloud,
  BookOpen,
  Code2,
  FlaskConical,
  Layers,
  Lightbulb,
  Binary,
  Presentation,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Trophy,
} from 'lucide-react';
import { Resource } from '@/types';
import { useApp } from '@/lib/context/AppContext';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { CAMPUS_ACADEMIC_HEADS } from '@/lib/data/academic-heads';
import ResourceCard from '@/components/resources/ResourceCard';
import BackgroundVideo from '@/components/common/BackgroundVideo';

const CATEGORIES = [
  { name: 'Assignments', icon: FileSpreadsheet, count: '140+ files', tag: 'Problem Sets' },
  { name: 'Programming', icon: Code2, count: '95+ files', tag: 'Source Code' },
  { name: 'Lab Records', icon: FlaskConical, count: '80+ files', tag: 'Observations' },
  { name: 'DTIE Projects', icon: Lightbulb, count: '45+ files', tag: 'Prototypes' },
  { name: 'Notes', icon: BookOpen, count: '210+ files', tag: 'Revision Slides' },
  { name: 'Mathematics', icon: Binary, count: '65+ files', tag: 'Graph Theory' },
  { name: 'Mini Projects', icon: Layers, count: '50+ files', tag: 'Semester Builds' },
  { name: 'Major Projects', icon: GraduationCap, count: '30+ files', tag: 'Capstone' },
];

const DEPARTMENTS = [
  'CSE • Computer Science',
  'AI&DS • Artificial Intelligence',
  'ECE • Electronics & Comm',
  'CS&IT • Information Tech',
  'DTIE • Design Thinking',
];

export default function HomePage() {
  const router = useRouter();
  const { openBenefitsAd } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [leaderboardDept, setLeaderboardDept] = useState<'ALL' | 'CSE' | 'AI&DS' | 'ECE' | 'CS&IT'>('ALL');

  useEffect(() => {
    setResources(MockStorageManager.getResources());
    const handleUpdate = () => setResources(MockStorageManager.getResources());
    window.addEventListener('klu_resources_change', handleUpdate);
    return () => window.removeEventListener('klu_resources_change', handleUpdate);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/explore');
    }
  };

  const recentResources = [...resources]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const popularResources = [...resources]
    .sort((a, b) => b.downloads_count - a.downloads_count)
    .slice(0, 3);

  return (
    <div className="space-y-24 pb-20">
      {/* AI AGENTIC DESIGN VSS HERO SECTION */}
      <section className="relative px-6 sm:px-12 lg:px-16 pt-12 pb-20 overflow-hidden bg-gradient-to-b from-[#0B0F19] via-[#0D1527] to-transparent">
        {/* Background "The Vault of Knowledge" - Cinematic Master Loop */}
        <BackgroundVideo src="/videos/vault-of-knowledge.mp4" opacity={0.85} overlayStyle="obsidian" />

        {/* Ambient atmospheric glows matching the design */}
        <div className="absolute top-1/4 -left-20 w-[480px] h-[480px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[520px] h-[520px] bg-purple-600/25 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Top Campus Insignia Emblem with Ambient Glow */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer transition-transform hover:scale-105 duration-300">
              <div className="absolute -inset-3 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#0F172A] border border-purple-500/40 flex items-center justify-center shadow-2xl">
                <GraduationCap className="h-8 w-8 text-[#D8B4FE]" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-500/10 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-[#38BDF8] animate-pulse" />
              <span className="text-[11px] font-bold font-mono tracking-wider text-[#D8B4FE] uppercase">
                Campus Academic Knowledge Network
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-center leading-[1.12]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D8B4FE] via-[#A855F7] to-[#38BDF8]">
                Virtual Student Space
              </span>
              <br />
              <span className="text-white drop-shadow-md">
                Learn, Share & Excel
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300/80 max-w-2xl mx-auto text-center leading-relaxed font-normal pt-1">
            The centralized repository for university course materials, verified handwritten notes, lab observations, assignments, and capstone projects.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white px-7 py-3 text-sm font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore Resources</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/requests"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#EC4899] via-[#F43F5E] to-[#FB7185] hover:from-[#DB2777] hover:to-[#E11D48] text-white px-7 py-3 text-sm font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Compass className="h-4 w-4" />
              <span>Resource Requests</span>
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-[#D8B4FE] border border-purple-500/40 px-6 py-3 text-sm font-bold shadow-lg shadow-purple-500/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-mono"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Academic Leaderboard 🏆</span>
            </Link>
          </div>

          {/* Integrated Search Bar */}
          <div className="max-w-xl mx-auto pt-4 space-y-3">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-[#1E293B]/70 backdrop-blur-md rounded-full px-5 py-2.5 border border-purple-500/30 hover:border-purple-400/80 transition-all shadow-lg"
            >
              <input
                type="text"
                placeholder="Search course code (e.g., 23CS2101), notes, lab records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button type="submit" className="text-[#38BDF8] hover:scale-110 transition-transform pl-2">
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Search Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-white/40 text-[11px] font-mono">Popular:</span>
              {['23CS2101', 'DTIE Projects', 'Advanced Java', 'Discrete Maths', 'Wireshark Lab', 'Machine Learning'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    router.push(`/explore?q=${encodeURIComponent(tag)}`);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-500/20 text-white/70 hover:text-white border border-white/10 hover:border-purple-500/40 transition text-[11px] font-mono"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 4-Metric Stats Strip */}
          <div className="pt-12 mt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {/* 1. Verified Resources */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="text-[#A855F7] group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 stroke-[1.75]" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                1,200+
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Verified Resources
              </div>
            </div>

            {/* 2. Course Codes */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="text-[#A855F7] group-hover:scale-110 transition-transform">
                <Code2 className="h-6 w-6 stroke-[1.75]" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                85+
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Course Codes
              </div>
            </div>

            {/* 3. Downloads */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="text-[#A855F7] group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 stroke-[1.75]" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                45,000+
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Resource Downloads
              </div>
            </div>

            {/* 4. Active Students */}
            <div className="flex flex-col items-center space-y-2 group">
              <div className="text-[#A855F7] group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 stroke-[1.75]" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                8,500+
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Active Students
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMIC HUBS EXPLORER BENTO */}
      <section className="px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] font-mono">
              Coursework & Labs
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Explore Academic Hubs
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] flex items-center gap-1 transition-colors"
          >
            <span>All Categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/explore?category=${encodeURIComponent(cat.name)}`}
              className="group p-5 rounded-3xl bg-[#131B2E]/70 border border-white/10 hover:border-purple-500/50 hover:bg-[#1A243B] transition-all duration-200 flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-300 group-hover:bg-gradient-to-r group-hover:from-[#8B5CF6] group-hover:to-[#3B82F6] group-hover:text-white transition-all">
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase">
                  {cat.tag}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm text-white group-hover:text-[#D8B4FE] transition-colors">
                  {cat.name}
                </p>
                <p className="text-[11px] text-white/60 font-medium mt-0.5">
                  {cat.count}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CAMPUS ACADEMIC HEADS & WEEKLY LEADERBOARD */}
      <section id="leaderboard" className="px-6 sm:px-12 lg:px-16 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-bold uppercase tracking-wider font-mono border border-purple-500/30">
              <Trophy className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span>Campus Academic Council &amp; Hall of Fame</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Campus Academic Heads &amp; Leaderboard
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-0.5">
              Official roster of appointed student academic leads. Every user receives a unique operational Code Name and campus position based on verified weekly contributions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter Pills */}
            <div className="flex items-center bg-[#131B2E] p-1 rounded-full border border-white/10 text-[11px] font-mono">
              {(['ALL', 'CSE', 'AI&DS', 'ECE', 'CS&IT'] as const).map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setLeaderboardDept(dept)}
                  className={`px-3 py-1 rounded-full transition font-bold ${
                    leaderboardDept === dept
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Post Work (+100 XP)</span>
            </Link>
          </div>
        </div>

        {/* Podium Top 3 Academic Head Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {CAMPUS_ACADEMIC_HEADS.slice(0, 3).map((leader) => {
            const isGold = leader.rank === 1;
            const isSilver = leader.rank === 2;
            const borderGlow = isGold
              ? 'border-amber-500/50 hover:border-amber-400 bg-gradient-to-b from-amber-500/15 via-[#131B2E] to-[#0D1527]'
              : isSilver
              ? 'border-slate-400/40 hover:border-slate-300 bg-gradient-to-b from-slate-400/15 via-[#131B2E] to-[#0D1527]'
              : 'border-amber-700/40 hover:border-amber-600 bg-gradient-to-b from-amber-700/15 via-[#131B2E] to-[#0D1527]';

            const badgeBg = isGold ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : isSilver ? 'bg-slate-400/20 text-slate-200 border-slate-400/30' : 'bg-amber-700/20 text-amber-200 border-amber-700/30';
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
                    <p className="text-[11px] text-[#D8B4FE] font-mono font-bold mt-0.5">{leader.academic_position}</p>
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

        {/* Full Council of Academic Heads Roster Table */}
        <div className="rounded-[2.5rem] bg-[#131B2E]/80 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Appointed Academic Heads Council ({CAMPUS_ACADEMIC_HEADS.filter((h) => leaderboardDept === 'ALL' || h.department === leaderboardDept).length} Leaders)
              </h3>
              <p className="text-[11px] text-white/50">
                Department leads overseeing peer-review, syllabus integrity, and weekly uploads.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#D8B4FE] bg-purple-500/15 border border-purple-500/30 px-3 py-1 rounded-full">
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
                  <th className="pb-3 text-right pr-2">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {CAMPUS_ACADEMIC_HEADS.filter(
                  (h) => leaderboardDept === 'ALL' || h.department === leaderboardDept
                ).map((leader) => (
                  <tr key={leader.code_name} className="hover:bg-white/5 transition-colors font-medium">
                    <td className="py-3.5 pl-2 font-mono font-black text-amber-300">
                      #{leader.rank}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[#38BDF8] font-mono font-bold text-[11px] tracking-wider">
                        {leader.code_name}
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
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono text-[10px] font-bold">
                        {leader.weekly_posts} posts • Unlocked ✓
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2 font-mono text-white/90">
                      <span className="font-bold text-[#38BDF8]">{leader.total_downloads}</span> dl
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* THE PEER LEARNING CYCLE */}
      <section className="px-6 sm:px-12 lg:px-16">
        <div className="rounded-[2.5rem] bg-[#131B2E]/90 border border-white/10 p-8 sm:p-12 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-bold uppercase tracking-wider border border-purple-500/30 font-mono">
              <Sparkles className="h-3 w-3 text-[#38BDF8]" />
              <span>Campus Innovation Model</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              From Isolated Chats to Virtual Student Space
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
              Coursework and DTIE prototypes should never get lost inside personal drives or expiring chats. Virtual Student Space gives every student's hard work a permanent home to benefit current and future batches.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-5 gap-3 pt-4">
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 text-center hover:border-purple-500/30 transition-colors">
                <span className="text-[10px] font-mono font-bold text-[#D8B4FE] uppercase tracking-wider">01. CREATE</span>
                <p className="text-xs font-bold text-white mt-1">Complete Work</p>
                <p className="text-[11px] text-white/50 mt-0.5">Finish lab or problem set</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 text-center hover:border-purple-500/30 transition-colors">
                <span className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider">02. SHARE</span>
                <p className="text-xs font-bold text-white mt-1">Upload to VSS</p>
                <p className="text-[11px] text-white/50 mt-0.5">Voluntary peer upload</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 text-center hover:border-purple-500/30 transition-colors">
                <span className="text-[10px] font-mono font-bold text-[#A855F7] uppercase tracking-wider">03. LEARN</span>
                <p className="text-xs font-bold text-white mt-1">Study Method</p>
                <p className="text-[11px] text-white/50 mt-0.5">Understand algorithms</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 text-center hover:border-purple-500/30 transition-colors">
                <span className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider">04. REFINE</span>
                <p className="text-xs font-bold text-white mt-1">Improve Code</p>
                <p className="text-[11px] text-white/50 mt-0.5">Optimize solutions</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 text-center hover:border-purple-500/30 transition-colors">
                <span className="text-[10px] font-mono font-bold text-[#F43F5E] uppercase tracking-wider">05. ADVANCE</span>
                <p className="text-xs font-bold text-white mt-1">Pay It Forward</p>
                <p className="text-[11px] text-white/50 mt-0.5">Contribute back</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING ACROSS CAMPUS */}
      <section className="px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/15 text-[#D8B4FE]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Trending Across Campus</h2>
              <p className="text-xs text-white/60 mt-0.5 font-medium">Most downloaded resources this week</p>
            </div>
          </div>
          <Link
            href="/explore?sort=downloads"
            className="text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularResources.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      </section>

      {/* RECENTLY SHARED */}
      <section className="px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Recently Published</h2>
              <p className="text-xs text-white/60 mt-0.5 font-medium">Fresh uploads from students and mentors</p>
            </div>
          </div>
          <Link
            href="/explore?sort=newest"
            className="text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] flex items-center gap-1 transition-colors"
          >
            <span>Explore All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentResources.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      </section>

      {/* COMMUNITY CTA BANNER */}
      <section className="px-6 sm:px-12 lg:px-16">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-purple-950/40 via-[#131B2E] to-indigo-950/40 border border-purple-500/30 p-8 sm:p-12 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl backdrop-blur-md">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-bold uppercase tracking-wider font-mono border border-purple-500/30">
              <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span>Campus Academic Contribution</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Have you solved a tough assignment or DTIE prototype?
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
              Pay it forward. Upload your code, lab observations, or lecture notes to Virtual Student Space to help fellow KL University classmates learn faster.
            </p>
          </div>
          <Link
            href="/upload"
            className="shrink-0 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Resource Now</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
