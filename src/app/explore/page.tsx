'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Grid,
  List,
  BookOpen,
  X,
  RotateCcw,
} from 'lucide-react';
import { Resource, ResourceCategory } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import ResourceCard from '@/components/resources/ResourceCard';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { ACADEMIC_CONTEXT_EVENT, getRelevantCourses, readAcademicContext, type AcademicContext } from '@/lib/academic-context';

function ExploreContent() {
  const { currentUser } = useApp();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = searchParams.get('sort') || 'newest';

  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [academic, setAcademic] = useState<AcademicContext | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>(initialSort);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setResources(MockStorageManager.getResources());
    const handleUpdate = () => setResources(MockStorageManager.getResources());
    window.addEventListener('klu_resources_change', handleUpdate);
    return () => window.removeEventListener('klu_resources_change', handleUpdate);
  }, []);

  useEffect(() => {
    const sync = () => setAcademic(readAcademicContext(currentUser));
    sync(); window.addEventListener(ACADEMIC_CONTEXT_EVENT, sync);
    return () => window.removeEventListener(ACADEMIC_CONTEXT_EVENT, sync);
  }, [currentUser]);

  const relevantCourses = useMemo(() => academic ? getRelevantCourses(currentUser, academic.semester) : [], [academic, currentUser]);
  const relevantCourseCodes = useMemo(() => new Set(relevantCourses.map((course) => course.code)), [relevantCourses]);
  const visibleCategories = useMemo(() => {
    const found = new Set<ResourceCategory>();
    resources.forEach((resource) => {
      if (academic && resource.semester === academic.semester && (!relevantCourseCodes.size || relevantCourseCodes.has(resource.course_code))) found.add(resource.category);
    });
    return ['All', ...Array.from(found)] as (ResourceCategory | 'All')[];
  }, [resources, academic, relevantCourseCodes]);

  useEffect(() => {
    if (searchParams.get('q')) setSearchQuery(searchParams.get('q') || '');
    if (searchParams.get('category')) setSelectedCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  const filteredResources = useMemo(() => {
    let result = resources.filter((res) => res.status === 'approved');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (res) =>
          res.title.toLowerCase().includes(q) ||
          res.description.toLowerCase().includes(q) ||
          res.course_code.toLowerCase().includes(q) ||
          res.course_name.toLowerCase().includes(q) ||
          res.category.toLowerCase().includes(q) ||
          res.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (academic?.semester) result = result.filter((res) => res.semester === academic.semester);
    if (relevantCourseCodes.size) result = result.filter((res) => relevantCourseCodes.has(res.course_code));

    if (selectedCategory !== 'All') {
      result = result.filter((res) => res.category === selectedCategory);
    }

    if (selectedCourse !== 'All') {
      result = result.filter((res) => res.course_code === selectedCourse);
    }

    if (selectedSort === 'downloads') {
      result.sort((a, b) => b.downloads_count - a.downloads_count);
    } else if (selectedSort === 'likes') {
      result.sort((a, b) => b.likes_count - a.likes_count);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [resources, searchQuery, selectedCategory, selectedCourse, selectedSort, academic, relevantCourseCodes]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCourse('All');
    setSelectedSort('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedCourse !== 'All';

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
      {/* Page Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] font-mono">
          Virtual Student Space Repository
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Explore Campus Knowledge
        </h1>
        <p className="text-xs sm:text-sm text-white/70 mt-1 font-normal">
          Discover verified peer assignments, lab records, DTIE innovation projects, and lecture summaries.
        </p>
      </div>

      {academic && <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3"><BookOpen className="h-4 w-4 shrink-0 text-violet-300" /><span className="min-w-0 flex-1"><b className="block text-[11px]">{academic.semester}</b><small className="block truncate text-[9px] text-white/30">Showing your {relevantCourses.length} relevant courses only</small></span><Link href="/settings" className="text-[10px] font-bold text-violet-300">Change</Link></div>}

      {/* Main Search & Control Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search 290+ courses (e.g. 26UC1137, DTIE, 26SC1101, Java, DSA), tags, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 rounded-full border border-white/15 bg-[#131B2E] pl-11 pr-10 text-xs sm:text-sm text-white placeholder-white/50 focus:border-purple-500 focus:outline-none shadow-card"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2.5 sm:flex sm:w-auto sm:flex-nowrap sm:shrink-0">
          {/* Course Filter Dropdown */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="h-11 min-w-0 rounded-full border border-white/15 bg-[#131B2E] px-3 text-xs text-white font-medium focus:border-purple-500 focus:outline-none shadow-card sm:max-w-[220px] sm:px-4 sm:text-sm truncate"
          >
            <option value="All" className="bg-[#131B2E] text-white">All Courses</option>
            {relevantCourses.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#131B2E] text-white">
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          {/* Sorting Dropdown */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="h-11 min-w-0 rounded-full border border-white/15 bg-[#131B2E] px-3 text-xs text-white font-medium focus:border-purple-500 focus:outline-none shadow-card sm:max-w-[150px] sm:px-4 sm:text-sm"
          >
            <option value="newest" className="bg-[#131B2E] text-white">Newest</option>
            <option value="downloads" className="bg-[#131B2E] text-white">Downloads</option>
            <option value="likes" className="bg-[#131B2E] text-white">Likes</option>
          </select>

          {/* View Layout Toggle */}
          <div className="flex items-center rounded-full border border-white/15 bg-[#131B2E] p-1 shadow-card shrink-0">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-2 rounded-full transition ${
                viewLayout === 'grid' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-sm' : 'text-white/60 hover:text-white'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`p-2 rounded-full transition ${
                viewLayout === 'list' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-sm' : 'text-white/60 hover:text-white'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {visibleCategories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25 font-extrabold'
                  : 'bg-[#131B2E] text-white/80 hover:bg-[#1A243B] hover:text-[#D8B4FE] border border-white/10'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs text-white/60 border-b border-white/10 pb-3">
        <span>
          Showing <strong className="text-white font-bold">{filteredResources.length}</strong> academic resources
        </span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[#D8B4FE] hover:text-[#38BDF8] font-bold transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Resource Cards */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/50">
          <BookOpen className="h-12 w-12 text-white/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching academic resources</h3>
          <p className="text-xs text-white/60 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            We couldn't find any resources matching your search criteria. Try modifying your keywords or resetting filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <ResourceCard key={res.id} resource={res} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((res) => (
            <ResourceCard key={res.id} resource={res} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-white/50">Loading resources...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
