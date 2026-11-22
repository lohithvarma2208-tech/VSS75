'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BookOpen, Braces, Clock3, Download, FileText,
  FlaskConical, Lightbulb, Search, Sparkles, Upload, Users,
} from 'lucide-react';
import type { Resource } from '@/types';
import { useApp } from '@/lib/context/AppContext';
import { MockStorageManager } from '@/lib/storage/mock-store';

const categories = [
  { name: 'Notes', label: 'Lecture & unit notes', icon: BookOpen, accent: 'from-violet-400/25 to-violet-400/0' },
  { name: 'Programming', label: 'Code & practice', icon: Braces, accent: 'from-cyan-400/20 to-cyan-400/0' },
  { name: 'Lab Records', label: 'Experiments & records', icon: FlaskConical, accent: 'from-emerald-400/20 to-emerald-400/0' },
  { name: 'Assignments', label: 'Solved references', icon: FileText, accent: 'from-amber-400/20 to-amber-400/0' },
  { name: 'DTIE Projects', label: 'Ideas & prototypes', icon: Lightbulb, accent: 'from-fuchsia-400/20 to-fuchsia-400/0' },
  { name: 'Mini Projects', label: 'Student builds', icon: Sparkles, accent: 'from-rose-400/20 to-rose-400/0' },
];

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [query, setQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    const refresh = () => setResources(MockStorageManager.getResources());
    refresh();
    window.addEventListener('klu_resources_change', refresh);
    return () => window.removeEventListener('klu_resources_change', refresh);
  }, []);

  const recent = [...resources].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
  const totalDownloads = resources.reduce((sum, item) => sum + item.downloads_count, 0);

  function search(event: React.FormEvent) {
    event.preventDefault();
    router.push(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : '/explore');
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 sm:py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#121214] px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(168,85,247,.28),transparent_31%),radial-gradient(circle_at_65%_90%,rgba(59,130,246,.12),transparent_35%)]" />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-violet-300/15" />
        <div className="absolute -right-4 -top-12 h-48 w-48 rounded-full border border-violet-300/10" />

        <div className="relative max-w-2xl">
          <p className="vss-kicker">{currentUser ? `Welcome back, ${currentUser.full_name}` : 'The KLU student commons'}</p>
          <h1 className="mt-4 text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl">
            Your semester,<br /><span className="text-violet-300">in one place.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/52 sm:text-base">
            Useful notes, lab records, code, and project references—shared by students who have already been there.
          </p>

          <form onSubmit={search} className="mt-8 flex max-w-xl items-center rounded-2xl border border-white/10 bg-black/35 p-1.5 backdrop-blur-sm">
            <Search className="ml-3 h-4 w-4 shrink-0 text-white/35" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a course, code, or topic" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
            <button className="rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-black">Search</button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {['26SC1101', 'Java', 'DTIE', 'Maths'].map((tag) => (
              <button key={tag} onClick={() => router.push(`/explore?q=${encodeURIComponent(tag)}`)} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-white/48 hover:text-white">{tag}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-7 grid grid-cols-3 gap-3">
        <Metric value={`${resources.length || 12}+`} label="Resources" icon={FileText} />
        <Metric value={totalDownloads > 999 ? `${(totalDownloads / 1000).toFixed(1)}k` : `${totalDownloads || 920}`} label="Downloads" icon={Download} />
        <Metric value="8" label="Study hubs" icon={Users} />
      </section>

      <section className="mt-12">
        <SectionTitle eyebrow="Browse by type" title="Find what you need" href="/explore" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={`/explore?category=${encodeURIComponent(item.name)}`} className="vss-card vss-card-hover relative min-h-40 overflow-hidden p-4">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                <div className="relative flex h-full flex-col justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/25"><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-extrabold tracking-tight">{item.name}</p>
                    <p className="mt-1 text-[10px] leading-4 text-white/40">{item.label}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[1.55fr_.75fr]">
        <div>
          <SectionTitle eyebrow="Fresh on VSS" title="Recently shared" href="/explore?sort=recent" />
          <div className="vss-card mt-5 overflow-hidden p-2">
            {recent.length > 0 ? recent.map((resource, index) => (
              <Link key={resource.id} href={`/resource/${resource.id}`} className={`group flex items-center gap-4 rounded-2xl p-3.5 transition hover:bg-white/[0.045] ${index !== recent.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.055] text-[10px] font-black uppercase text-violet-300">{resource.file_type}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white/88 group-hover:text-white">{resource.title}</span>
                  <span className="mt-1 flex items-center gap-2 text-[10px] text-white/35"><b className="font-mono text-white/50">{resource.course_code}</b><i className="h-1 w-1 rounded-full bg-white/20" />{resource.resource_type}</span>
                </span>
                <span className="hidden items-center gap-1 text-[10px] text-white/35 sm:flex"><Download className="h-3 w-3" /> {resource.downloads_count}</span>
                <ArrowRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white" />
              </Link>
            )) : <div className="p-8 text-center"><p className="text-sm font-bold">The shelf is ready.</p><p className="mt-1 text-xs text-white/35">Be the first to share something useful.</p></div>}
          </div>
        </div>

        <aside className="space-y-4 lg:pt-11">
          <div className="vss-card overflow-hidden p-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-400 text-black"><Upload className="h-5 w-5" /></div>
            <h2 className="mt-7 text-xl font-extrabold tracking-tight">Help the next student.</h2>
            <p className="mt-2 text-xs leading-5 text-white/42">Upload clean notes, a lab reference, or code you wish you had earlier.</p>
            <Link href="/upload" className="vss-button mt-6 w-full">Share a resource <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <Link href="/requests" className="vss-card vss-card-hover flex items-center gap-4 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06]"><Clock3 className="h-4 w-4 text-violet-300" /></span>
            <span className="min-w-0 flex-1"><b className="block text-sm">Open requests</b><small className="text-[10px] text-white/35">See what students need today</small></span>
            <ArrowRight className="h-4 w-4 text-white/25" />
          </Link>
        </aside>
      </section>
    </div>
  );
}

function Metric({ value, label, icon: Icon }: { value: string; label: string; icon: typeof FileText }) {
  return (
    <div className="vss-card flex min-w-0 items-center justify-center gap-2.5 px-2 py-4 sm:gap-4 sm:p-5">
      <span className="hidden h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-violet-300 sm:grid"><Icon className="h-4 w-4" /></span>
      <span><b className="block text-center text-base font-extrabold tracking-tight sm:text-left sm:text-xl">{value}</b><small className="block truncate text-[9px] text-white/35 sm:text-[10px]">{label}</small></span>
    </div>
  );
}

function SectionTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div><p className="vss-kicker">{eyebrow}</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">{title}</h2></div>
      <Link href={href} className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}
