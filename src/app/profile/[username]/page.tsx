'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck, BookOpen, CalendarDays, Download, Edit3, ExternalLink,
  GraduationCap, Heart, Layers, Settings, Share2, X,
} from 'lucide-react';
import type { ProjectItem, Resource, UserProfile } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import ResourceCard from '@/components/resources/ResourceCard';
import BadgeShelf from '@/components/profile/BadgeShelf';
import { getStudentBadges } from '@/lib/badges';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { currentUser, setCurrentUser, showToast, openVerifyModal } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tab, setTab] = useState<'resources' | 'projects' | 'badges'>('resources');
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    const target = currentUser?.username === username ? currentUser : null;
    if (!target) { setProfile(null); setResources([]); setProjects([]); return; }
    setProfile(target);
    setBio(target.bio || ''); setDepartment(target.department); setSemester(target.semester);
    const allResources = MockStorageManager.getResources();
    setResources(allResources.filter((item) => item.author_username === target.username || item.author_name === target.full_name || item.author_id === target.id));
    setProjects(MockStorageManager.getProjects().filter((item) => item.author_username === target.username || item.author_name === target.full_name));
  }, [username, currentUser]);

  if (!profile) return null;
  const owner = currentUser?.username === profile.username || currentUser?.id === profile.id;
  const downloads = resources.reduce((sum, item) => sum + item.downloads_count, 0);
  const likes = resources.reduce((sum, item) => sum + item.likes_count, 0);
  const badges = getStudentBadges({ profile, resources, projects });
  const earnedBadges = badges.filter((item) => item.earned);
  const score = resources.length * 100 + likes * 2 + downloads + projects.length * 150;
  const level = Math.max(1, Math.floor(score / 500) + 1);
  const nextLevelProgress = score % 500;

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    const updated: UserProfile = { ...profile, bio: bio.trim(), department: department.trim(), semester: semester.trim() };
    setProfile(updated);
    if (owner) setCurrentUser(updated);
    setEditing(false);
    showToast('Profile updated', 'success');
  }

  async function shareProfile() {
    await navigator.clipboard.writeText(window.location.href);
    showToast('Profile link copied', 'info');
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-7 sm:py-11">
      <section className="relative overflow-hidden rounded-[1.8rem] border border-white/[0.08] bg-[#121214] p-5 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_18%_0%,rgba(167,139,250,.22),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-500 text-xl font-black text-black sm:h-20 sm:w-20 sm:text-2xl">
              {profile.username.charAt(0).toUpperCase()}
              {profile.is_verified_student && <BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#121214] p-1 text-violet-300" />}
            </div>
            <div className="min-w-0 pt-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="max-w-full truncate text-xl font-extrabold tracking-[-0.035em] sm:text-3xl">{profile.full_name}</h1>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white/45">{profile.role}</span>
              </div>
              <p className="mt-1 truncate font-mono text-[10px] text-white/35">@{profile.username}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/45">
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5 text-violet-300" />{profile.department} · {profile.semester}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button onClick={shareProfile} className="vss-button-secondary flex-1 px-4 py-2.5 text-xs sm:flex-none"><Share2 className="h-3.5 w-3.5" /> Share</button>
            {owner && <button onClick={() => setEditing(true)} className="vss-button-secondary flex-1 px-4 py-2.5 text-xs sm:flex-none"><Edit3 className="h-3.5 w-3.5" /> Edit</button>}
            {owner && <Link href="/settings" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/55 hover:text-white" aria-label="Settings"><Settings className="h-4 w-4" /></Link>}
          </div>
        </div>

        {profile.bio && <p className="relative mt-6 max-w-2xl text-xs leading-5 text-white/48 sm:text-sm sm:leading-6">{profile.bio}</p>}

        <div className="relative mt-7 grid grid-cols-4 gap-2 border-t border-white/[0.07] pt-5">
          <Stat value={resources.length} label="Shares" />
          <Stat value={downloads} label="Downloads" />
          <Stat value={likes} label="Likes" />
          <Stat value={earnedBadges.length} label="Badges" />
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-[1.5fr_.8fr]">
        <div className="vss-card p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="vss-kicker">Contribution level</p><h2 className="mt-1 text-lg font-extrabold">Level {level}</h2></div><span className="font-mono text-[10px] text-violet-300">{score} XP</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" style={{ width: `${Math.max(4, (nextLevelProgress / 500) * 100)}%` }} /></div>
          <p className="mt-2 text-[9px] text-white/30">{500 - nextLevelProgress} XP until level {level + 1} · Shares +100 · Likes +2 · Downloads +1</p>
        </div>
        <div className="vss-card flex items-center gap-4 p-5 sm:p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-400 text-lg font-black text-black">{earnedBadges.length}</span>
          <span><b className="block text-sm">Badges unlocked</b><small className="mt-1 block text-[10px] text-white/35">Keep helping students to earn more.</small></span>
        </div>
      </section>

      <div className="mt-9 flex gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.025] p-1">
        <TabButton active={tab === 'resources'} onClick={() => setTab('resources')} icon={BookOpen} label={`Resources ${resources.length}`} />
        <TabButton active={tab === 'projects'} onClick={() => setTab('projects')} icon={Layers} label={`Projects ${projects.length}`} />
        <TabButton active={tab === 'badges'} onClick={() => setTab('badges')} icon={BadgeCheck} label={`Badges ${earnedBadges.length}`} />
      </div>

      <div className="mt-6">
        {tab === 'badges' ? <BadgeShelf badges={badges} /> : tab === 'resources' ? (
          resources.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{resources.map((item) => <ResourceCard key={item.id} resource={item} />)}</div> : <EmptyState text="No resources shared yet." />
        ) : projects.length ? (
          <div className="grid gap-4 md:grid-cols-2">{projects.map((project) => <article key={project.id} className="vss-card vss-card-hover p-5"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-[9px] font-bold text-violet-300">{project.category}</span><span className="text-[9px] text-white/25">{formatDate(project.created_at)}</span></div><h3 className="mt-4 text-base font-extrabold">{project.title}</h3><p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/40">{project.description}</p>{project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-violet-300">Open project <ExternalLink className="h-3 w-3" /></a>}</article>)}</div>
        ) : <EmptyState text="No projects showcased yet." />}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-[2rem] border border-white/10 bg-[#17171a] p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Edit profile</h2><button onClick={() => setEditing(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05]"><X className="h-4 w-4" /></button></div>
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <Field label="Department"><input value={department} onChange={(event) => setDepartment(event.target.value)} required className="profile-input" /></Field>
              <Field label="Semester"><input value={semester} onChange={(event) => setSemester(event.target.value)} required className="profile-input" /></Field>
              <Field label="Bio"><textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} className="profile-input resize-none" /></Field>
              <div className="flex gap-2 pt-2"><button type="button" onClick={() => setEditing(false)} className="vss-button-secondary flex-1">Cancel</button><button type="submit" className="vss-button flex-1">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) { return <div className="min-w-0 text-center"><b className="block truncate text-lg font-extrabold sm:text-2xl">{value > 999 ? `${(value / 1000).toFixed(1)}k` : value}</b><small className="mt-1 block truncate text-[8px] text-white/30 sm:text-[10px]">{label}</small></div>; }
function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof BookOpen; label: string }) { return <button onClick={onClick} className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold transition ${active ? 'bg-white text-black' : 'text-white/38 hover:text-white'}`}><Icon className="h-3.5 w-3.5" />{label}</button>; }
function EmptyState({ text }: { text: string }) { return <div className="vss-card border-dashed px-5 py-14 text-center text-xs text-white/35">{text}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-bold text-white/45">{label}</span>{children}</label>; }
