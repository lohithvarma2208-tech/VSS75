'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Github,
  ExternalLink,
  Plus,
  Users,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { ProjectItem } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';

const PROJECT_CATEGORIES = [
  'All',
  'Mini Project',
  'Major Project',
  'DTIE Project',
  'Hackathon Project',
  'Hardware Project',
  'Software Project',
  'AI/ML Project',
  'Research Project',
];

export default function ProjectsPage() {
  const { currentUser, showToast } = useApp();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectItem['category']>('Mini Project');
  const [newTechStack, setNewTechStack] = useState('');
  const [newGithubUrl, setNewGithubUrl] = useState('');
  const [newLiveUrl, setNewLiveUrl] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('23CS3105');
  const [newSemester, setNewSemester] = useState('Sem 4');
  const [newTeamMembers, setNewTeamMembers] = useState('');

  useEffect(() => {
    setProjects(MockStorageManager.getProjects());
    const handleUpdate = () => setProjects(MockStorageManager.getProjects());
    window.addEventListener('klu_projects_change', handleUpdate);
    return () => window.removeEventListener('klu_projects_change', handleUpdate);
  }, []);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.tech_stack || []).some((t) => (t || '').toLowerCase().includes(q)) ||
          (p.author_name || '').toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    return result;
  }, [projects, searchQuery, selectedCategory]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      showToast('Please fill in title and description', 'error');
      return;
    }

    const techArray = newTechStack
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const teamArray = newTeamMembers
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    MockStorageManager.addProject({
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      tech_stack: techArray.length > 0 ? techArray : ['Next.js', 'TypeScript'],
      github_url: newGithubUrl.trim() || undefined,
      live_url: newLiveUrl.trim() || undefined,
      course_code: newCourseCode.trim(),
      semester: newSemester,
      academic_year: '2024-2025',
      team_members: teamArray.length > 0 ? teamArray : [currentUser?.code_name || `@${currentUser?.username || 'anonymous'}`],
      author_name: currentUser?.code_name || `@${currentUser?.username || 'anonymous'}`,
      author_username: currentUser?.username || 'anonymous',
    });

    setIsCreateModalOpen(false);
    showToast('Project registered in Virtual Student Space!', 'success');

    setNewTitle('');
    setNewDescription('');
    setNewTechStack('');
    setNewGithubUrl('');
    setNewLiveUrl('');
    setNewTeamMembers('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] font-mono">
            Engineering Innovations
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
            Project Showcase
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 font-normal">
            Discover student-built Capstone Major Projects, DTIE Prototypes, Hackathon submissions, and Hardware setups.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Showcase Project</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search projects by title, tech stack (e.g. YOLO, ROS2, React), or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 rounded-full border border-white/15 bg-[#131B2E] pl-11 pr-4 text-xs sm:text-sm text-white placeholder-white/50 focus:border-purple-500 focus:outline-none shadow-card"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PROJECT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-extrabold shadow-md shadow-indigo-500/25'
                  : 'bg-[#131B2E] text-white/80 hover:bg-[#1A243B] hover:text-[#D8B4FE] border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-16 text-center rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/50">
          <Layers className="h-12 w-12 text-white/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No student projects published yet</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Be the first to publish a capstone project, mini-project, or hackathon build to the campus directory.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition"
          >
            Publish Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((proj) => (
          <div
            key={proj.id}
            className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/80 p-7 shadow-card hover:border-purple-500/50 hover:bg-[#1A243B] transition-all flex flex-col justify-between"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30">
                  {proj.category}
                </span>
                {proj.course_code && (
                  <span className="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-full">
                    {proj.course_code}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {proj.title}
              </h2>

              <p className="text-xs text-white/70 leading-relaxed line-clamp-3 font-normal">
                {proj.description}
              </p>

              {/* Tech Stack Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proj.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] font-mono bg-white/5 text-[#38BDF8] px-2.5 py-0.5 rounded-full border border-white/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Team members */}
              {proj.team_members && proj.team_members.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-white/50 pt-3 border-t border-white/10">
                  <Users className="h-3.5 w-3.5 text-white/40" />
                  <span className="truncate">Team: {proj.team_members.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Project Card Footer */}
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">By {proj.author_name}</span>

              <div className="flex items-center gap-2">
                {proj.github_url && (
                  <a
                    href={proj.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    title="View GitHub Repository"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {proj.live_url && (
                  <a
                    href={proj.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-sm transition"
                    title="Live Prototype"
                  >
                    <span>Live Demo</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Showcase Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-[2.5rem] bg-[#131B2E] border border-white/15 max-h-[90vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="font-extrabold text-base text-white">
                Showcase Your KLU Project
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smart Irrigation using LoRaWAN and Soil Moisture Telemetry"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    {PROJECT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0B0F19] text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Description & Impact *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the technical architecture, problem statement, and results..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-[#0B0F19] p-3 text-xs text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Tech Stack (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, OpenCV, ESP32, React, FastAPI"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    GitHub URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={newGithubUrl}
                    onChange={(e) => setNewGithubUrl(e.target.value)}
                    className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    Live Demo Link (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLiveUrl}
                    onChange={(e) => setNewLiveUrl(e.target.value)}
                    className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Team Members (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Lead Student, Contributor 1, Contributor 2"
                  value={newTeamMembers}
                  onChange={(e) => setNewTeamMembers(e.target.value)}
                  className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2.5 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25"
                >
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
