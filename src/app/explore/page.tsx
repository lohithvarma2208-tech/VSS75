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
  Sparkles,
} from 'lucide-react';
import { Resource, ResourceCategory } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import ResourceCard from '@/components/resources/ResourceCard';
import { SAMPLE_COURSES } from '@/lib/data/sample-data';

const ALL_CATEGORIES: (ResourceCategory | 'All')[] = [
  'All',
  'Assignments',
  'Programming',
  'Lab Records',
  'Lab Experiments',
  'DTIE Projects',
  'Notes',
  'Mini Projects',
  'Major Projects',
  'Mathematics',
  'Presentations',
  'Reports',
  'Study Resources',
  'Other Academic Resources',
];

const ALL_TERMS = [
  'All',
  'Tri-Sem 1 (T1)',
  'Tri-Sem 2 (T2)',
  'Tri-Sem 3 (T3)',
  'Tri-Sem 4 (T4)',
  'Tri-Sem 5 (T5)',
  'Tri-Sem 6 (T6)',
  'Tri-Sem 7 (T7)',
  'Tri-Sem 8 (T8)',
  'Tri-Sem 9 (T9)',
  'Tri-Sem 10 (T10)',
  'Tri-Sem 11 (T11)',
  'Tri-Sem 12 (T12)',
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6',
  'Sem 7',
  'Sem 8',
];

const BATCH_TRACK_FILTERS = [
  { id: 'All', label: 'All Batches (290+ Courses)' },
  { id: 'Y26-PBL', label: 'Y26 Honours PBL (Tri-Sem)' },
  { id: 'Y26-REG', label: 'Y26 Regular (Tri-Sem)' },
  { id: 'Y25-REG', label: 'Y25 Regular (Bi-Sem)' },
  { id: 'Y25-PBL', label: 'Y25 Honours PBL (Tri-Sem)' },
  { id: 'Y24-REG', label: 'Y24/Y23 Regular (Bi-Sem)' },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = searchParams.get('sort') || 'newest';

  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>(initialSort);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setResources(MockStorageManager.getResources());
    const handleUpdate = () => setResources(MockStorageManager.getResources());
    window.addEventListener('klu_resources_change', handleUpdate);
    return () => window.removeEventListener('klu_resources_change', handleUpdate);
  }, []);

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

    if (selectedBatch === 'Y26-PBL') {
      result = result.filter(
        (res) =>
          (res.course_code || '').startsWith('26') &&
          ((res.tags || []).includes('PBL') || (res.semester || '').startsWith('Tri') || (res.resource_type || '').includes('PBL') || (res.tags || []).includes('Honours PBL'))
      );
    } else if (selectedBatch === 'Y26-REG') {
      result = result.filter((res) => (res.course_code || '').startsWith('26'));
    } else if (selectedBatch === 'Y25-REG') {
      result = result.filter(
        (res) =>
          ((res.course_code || '').startsWith('25') || (res.academic_year || '').includes('2025')) &&
          (res.semester || '').startsWith('Sem')
      );
    } else if (selectedBatch === 'Y25-PBL') {
      result = result.filter(
        (res) =>
          ((res.course_code || '').startsWith('25') || (res.academic_year || '').includes('2025')) &&
          ((res.tags || []).includes('PBL') || (res.semester || '').startsWith('Tri'))
      );
    } else if (selectedBatch === 'Y24-REG') {
      result = result.filter(
        (res) =>
          (res.course_code || '').startsWith('23') ||
          (res.course_code || '').startsWith('24') ||
          (res.academic_year || '').includes('2024')
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((res) => res.category === selectedCategory);
    }

    if (selectedCourse !== 'All') {
      result = result.filter((res) => res.course_code === selectedCourse);
    }

    if (selectedSemester !== 'All') {
      result = result.filter((res) => res.semester === selectedSemester);
    }

    if (selectedSort === 'downloads') {
      result.sort((a, b) => b.downloads_count - a.downloads_count);
    } else if (selectedSort === 'likes') {
      result.sort((a, b) => b.likes_count - a.likes_count);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [resources, searchQuery, selectedBatch, selectedCategory, selectedCourse, selectedSemester, selectedSort]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBatch('All');
    setSelectedCategory('All');
    setSelectedCourse('All');
    setSelectedSemester('All');
    setSelectedSort('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedBatch !== 'All' ||
    selectedCategory !== 'All' ||
    selectedCourse !== 'All' ||
    selectedSemester !== 'All';

  return (
    <div className="px-6 sm:px-12 lg:px-16 py-10 space-y-8">
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

      {/* Curriculum Batch Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider font-mono mr-1">
          Academic Track:
        </span>
        {BATCH_TRACK_FILTERS.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBatch(b.id)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
              selectedBatch === b.id
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white border-transparent shadow-md shadow-indigo-500/25'
                : 'bg-[#131B2E]/80 text-white/70 border-white/10 hover:border-purple-500/30 hover:text-white'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Main Search & Control Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 min-w-[200px]">
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

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          {/* Course Filter Dropdown */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="h-11 rounded-full border border-white/15 bg-[#131B2E] px-4 text-xs sm:text-sm text-white font-medium focus:border-purple-500 focus:outline-none shadow-card max-w-[180px] sm:max-w-[220px] truncate"
          >
            <option value="All" className="bg-[#131B2E] text-white">All Courses</option>
            {SAMPLE_COURSES.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#131B2E] text-white">
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          {/* Semester Filter Dropdown */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="h-11 rounded-full border border-white/15 bg-[#131B2E] px-4 text-xs sm:text-sm text-white font-medium focus:border-purple-500 focus:outline-none shadow-card max-w-[150px] sm:max-w-[170px] truncate"
          >
            {ALL_TERMS.map((s) => (
              <option key={s} value={s} className="bg-[#131B2E] text-white">
                {s === 'All' ? 'All Terms' : s}
              </option>
            ))}
          </select>

          {/* Sorting Dropdown */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="h-11 rounded-full border border-white/15 bg-[#131B2E] px-4 text-xs sm:text-sm text-white font-medium focus:border-purple-500 focus:outline-none shadow-card max-w-[130px] sm:max-w-[150px]"
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
        {ALL_CATEGORIES.map((cat) => {
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
