'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Layers,
  Edit3,
  X,
} from 'lucide-react';
import { UserProfile, Resource, ProjectItem } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { DEMO_USERS } from '@/lib/data/sample-data';
import { useApp } from '@/lib/context/AppContext';
import ResourceCard from '@/components/resources/ResourceCard';
import { formatDate } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { generateUserCodeName, getUserAcademicPosition } from '@/lib/data/academic-heads';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { currentUser, setCurrentUser, showToast, openVerifyModal } = useApp();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userResources, setUserResources] = useState<Resource[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);
  const [activeTab, setActiveTab] = useState<'resources' | 'projects'>('resources');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editSemester, setEditSemester] = useState('');

  useEffect(() => {
    let target = DEMO_USERS.find((u) => u.username === username);
    if (!target && currentUser && currentUser.username === username) {
      target = currentUser;
    }
    if (!target) {
      target = currentUser || DEMO_USERS[0];
    }
    setProfile(target);

    setEditName(target.full_name);
    setEditBio(target.bio || '');
    setEditDept(target.department);
    setEditSemester(target.semester);

    const allResources = MockStorageManager.getResources();
    const filtered = allResources.filter(
      (r) =>
        r.author_username === target?.username ||
        r.author_name === target?.full_name ||
        r.author_id === target?.id
    );
    setUserResources(filtered);

    const allProjects = MockStorageManager.getProjects();
    const projFiltered = allProjects.filter(
      (p) =>
        p.author_username === target?.username ||
        p.author_name === target?.full_name
    );
    setUserProjects(projFiltered);
  }, [username, currentUser]);

  if (!profile) return null;

  const isOwner = currentUser?.username === profile.username || currentUser?.id === profile.id;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      full_name: profile.code_name || profile.username,
      bio: editBio.trim(),
      department: editDept.trim(),
      semester: editSemester.trim(),
    };
    setProfile(updated);
    if (isOwner) {
      setCurrentUser(updated);
    }
    setIsEditModalOpen(false);
    showToast('Profile updated successfully!', 'success');
  };

  const totalDownloads = userResources.reduce((acc, r) => acc + r.downloads_count, 0);
  const totalLikes = userResources.reduce((acc, r) => acc + r.likes_count, 0);

  return (
    <div className="px-6 sm:px-12 lg:px-16 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/70 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-500/30 shrink-0 font-mono">
              {(profile.code_name || profile.username).charAt(0)}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
                  @{profile.username}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-purple-500/20 text-[#D8B4FE] border border-purple-500/30">
                  {profile.role}
                </span>
                {profile.is_verified_student ? (
                  <VerifiedBadge size="sm" />
                ) : isOwner ? (
                  <button
                    onClick={openVerifyModal}
                    className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-mono font-bold hover:bg-[#f59e0b]/30 transition"
                  >
                    <span>Verify Institutional Email</span>
                  </button>
                ) : null}
              </div>

              {/* Unique Code Name & Academic Head Position */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[#38BDF8] font-mono font-bold text-xs tracking-wider">
                  [{profile.code_name || generateUserCodeName(profile.username)}]
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[#D8B4FE] font-mono font-bold text-xs">
                  {profile.academic_position || getUserAcademicPosition(profile)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <GraduationCap className="h-4 w-4 text-[#38BDF8]" />
                  {profile.department} ({profile.semester})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-white/50">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {formatDate(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-[#131B2E] text-xs font-bold text-white hover:bg-[#1A243B] transition"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#D8B4FE]" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="mt-6 text-xs sm:text-sm text-white/80 border-t border-white/10 pt-4 leading-relaxed max-w-3xl">
            {profile.bio}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mt-8 border-t border-white/10 pt-6 text-center sm:text-left">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{userResources.length}</p>
            <p className="text-xs text-white/50 mt-0.5 font-medium">Shared Resources</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#38BDF8]">{totalDownloads}</p>
            <p className="text-xs text-white/50 mt-0.5 font-medium">Peer Downloads</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-400">{totalLikes}</p>
            <p className="text-xs text-white/50 mt-0.5 font-medium">Likes Earned</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-6">
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'resources'
              ? 'border-purple-400 text-[#D8B4FE]'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Shared Resources ({userResources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'projects'
              ? 'border-purple-400 text-[#D8B4FE]'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Projects Showcase ({userProjects.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'resources' ? (
        userResources.length === 0 ? (
          <div className="p-16 text-center rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/40">
            <p className="text-xs text-white/50">No resources shared by this student yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userResources.map((res) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        )
      ) : userProjects.length === 0 ? (
        <div className="p-16 text-center rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/40">
          <p className="text-xs text-white/50">No projects listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-6 rounded-[2rem] border border-white/10 bg-[#131B2E]/70 hover:border-purple-500/40 hover:bg-[#1A243B] shadow-card space-y-3 transition"
            >
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30">
                  {proj.category}
                </span>
                <span className="text-xs text-white/40 font-mono">{formatDate(proj.created_at)}</span>
              </div>
              <h3 className="font-bold text-lg text-white">{proj.title}</h3>
              <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{proj.description}</p>
              <div className="flex flex-wrap gap-1">
                {proj.tech_stack.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-purple-500/15 text-[#D8B4FE] px-2.5 py-0.5 rounded-full font-mono border border-purple-500/25"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[2.5rem] bg-[#0D1527] border border-white/15 overflow-hidden text-white shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="font-extrabold text-base text-white">Edit Student Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  placeholder="e.g. CSE, AI&DS, ECE"
                  className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Semester
                </label>
                <input
                  type="text"
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  placeholder="e.g. Sem 4"
                  className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Academic Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Describe your research interests, favorite courses, or clubs..."
                  className="w-full rounded-2xl border border-white/15 bg-[#0B0F19] p-3 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-lg shadow-indigo-500/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
