'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
  User,
  Bookmark,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  X,
  FileQuestion,
} from 'lucide-react';
import { ResourceRequest, RequestOffer, RequestResponse, ResourceCategory } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import RequestCard from '@/components/requests/RequestCard';

const CATEGORIES: ResourceCategory[] = [
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

const PROGRAMMES = ['All Programmes', 'B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA'];

const SEMESTERS = [
  'All Semesters',
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6',
  'Sem 7',
  'Sem 8',
  'Tri-Sem 1 (T1)',
  'Tri-Sem 2 (T2)',
  'Tri-Sem 3 (T3)',
  'Tri-Sem 4 (T4)',
];

type TabType = 'all' | 'open' | 'fulfilled' | 'my_requests' | 'saved';
type SortType = 'newest' | 'oldest' | 'most_responses' | 'most_popular' | 'recently_fulfilled';

export default function RequestsFeedPage() {
  const { currentUser, savedRequestIds } = useApp();

  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [responses, setResponses] = useState<RequestResponse[]>([]);

  // Search & Filter State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('All Programmes');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Load live data from MockStorageManager and subscribe to events
  const loadData = () => {
    setRequests(MockStorageManager.getResourceRequests());
    setOffers(MockStorageManager.getRequestOffers());
    setResponses(MockStorageManager.getRequestResponses());
  };

  useEffect(() => {
    loadData();

    const handleReqChange = () => setRequests(MockStorageManager.getResourceRequests());
    const handleOffChange = () => setOffers(MockStorageManager.getRequestOffers());
    const handleRespChange = () => setResponses(MockStorageManager.getRequestResponses());

    window.addEventListener('klu_requests_change', handleReqChange);
    window.addEventListener('klu_offers_change', handleOffChange);
    window.addEventListener('klu_request_responses_change', handleRespChange);
    window.addEventListener('klu_saved_requests_change', handleReqChange);

    return () => {
      window.removeEventListener('klu_requests_change', handleReqChange);
      window.removeEventListener('klu_offers_change', handleOffChange);
      window.removeEventListener('klu_request_responses_change', handleRespChange);
      window.removeEventListener('klu_saved_requests_change', handleReqChange);
    };
  }, []);

  // Summary statistics computed directly from storage
  const stats = useMemo(() => {
    return MockStorageManager.getRequestsSummaryStats(currentUser?.id);
  }, [requests, currentUser]);

  // Offers and responses map by requestId
  const countsByRequestId = useMemo(() => {
    const map: Record<string, { offers: number; responses: number }> = {};
    for (const req of requests) {
      map[req.id] = { offers: 0, responses: 0 };
    }
    for (const off of offers) {
      if (map[off.request_id]) map[off.request_id].offers += 1;
    }
    for (const resp of responses) {
      if (map[resp.request_id]) map[resp.request_id].responses += 1;
    }
    return map;
  }, [requests, offers, responses]);

  // Filtering & Sorting
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Tab filter
    if (activeTab === 'open') {
      result = result.filter((r) => r.status === 'open' || r.status === 'partially_fulfilled');
    } else if (activeTab === 'fulfilled') {
      result = result.filter((r) => r.status === 'fulfilled');
    } else if (activeTab === 'my_requests') {
      result = result.filter(
        (r) =>
          r.user_id === currentUser?.id ||
          r.requester_name === currentUser?.full_name ||
          r.requester_username === currentUser?.username
      );
    } else if (activeTab === 'saved') {
      result = result.filter((r) => savedRequestIds.includes(r.id));
    }

    // Search query filter (title, description, course name, course code, tags, topic/module)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        return (
          (r.title || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.course_code || '').toLowerCase().includes(q) ||
          (r.course_name || '').toLowerCase().includes(q) ||
          (r.topic && r.topic.toLowerCase().includes(q)) ||
          (r.module_number && r.module_number.toLowerCase().includes(q)) ||
          (r.assignment_number && r.assignment_number.toLowerCase().includes(q)) ||
          (r.tags || []).some((t) => (t || '').toLowerCase().includes(q))
        );
      });
    }

    // Programme filter
    if (selectedProgramme !== 'All Programmes') {
      result = result.filter((r) => r.programme === selectedProgramme);
    }

    // Semester filter
    if (selectedSemester !== 'All Semesters') {
      result = result.filter((r) => r.semester === selectedSemester);
    }

    // Category filter
    if (selectedCategory !== 'All Categories') {
      result = result.filter((r) => r.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'All Statuses') {
      result = result.filter((r) => r.status === selectedStatus);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'most_responses') {
        const respA = countsByRequestId[a.id]?.responses || 0;
        const respB = countsByRequestId[b.id]?.responses || 0;
        return respB - respA;
      }
      if (sortBy === 'most_popular') {
        const popA =
          (countsByRequestId[a.id]?.offers || 0) * 2 + (countsByRequestId[a.id]?.responses || 0);
        const popB =
          (countsByRequestId[b.id]?.offers || 0) * 2 + (countsByRequestId[b.id]?.responses || 0);
        return popB - popA;
      }
      if (sortBy === 'recently_fulfilled') {
        if (a.status === 'fulfilled' && b.status !== 'fulfilled') return -1;
        if (b.status === 'fulfilled' && a.status !== 'fulfilled') return 1;
        return (
          new Date(b.fulfilled_at || b.updated_at).getTime() -
          new Date(a.fulfilled_at || a.updated_at).getTime()
        );
      }
      return 0;
    });

    return result;
  }, [
    requests,
    activeTab,
    searchQuery,
    selectedProgramme,
    selectedSemester,
    selectedCategory,
    selectedStatus,
    sortBy,
    currentUser,
    savedRequestIds,
    countsByRequestId,
  ]);

  const hasActiveFilters =
    selectedProgramme !== 'All Programmes' ||
    selectedSemester !== 'All Semesters' ||
    selectedCategory !== 'All Categories' ||
    selectedStatus !== 'All Statuses' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedProgramme('All Programmes');
    setSelectedSemester('All Semesters');
    setSelectedCategory('All Categories');
    setSelectedStatus('All Statuses');
    setSearchQuery('');
  };

  return (
    <div className="px-6 sm:px-12 lg:px-16 py-10 space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-mono font-bold tracking-wider border border-purple-500/30">
              COMMUNITY DEMAND
            </span>
            <span className="text-xs text-white/50">KL Deemed to be University</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Resource Requests
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-xl font-normal">
            Find resources you need or help another student.
          </p>
        </div>

        <Link
          href="/requests/new"
          className="shrink-0 px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create Request</span>
        </Link>
      </div>

      {/* 2. REAL DATABASE-BACKED SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 p-5 sm:p-6 backdrop-blur-md shadow-card">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Requests</span>
            <Layers className="h-4 w-4 text-[#D8B4FE]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.total}</p>
          <span className="text-[11px] text-white/50 mt-1 block">Across all KLU departments</span>
        </div>

        {/* Open Requests */}
        <div className="rounded-3xl border border-amber-500/20 bg-[#131B2E]/70 p-5 sm:p-6 backdrop-blur-md shadow-card">
          <div className="flex items-center justify-between text-amber-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Open Requests</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-300">{stats.open}</p>
          <span className="text-[11px] text-white/50 mt-1 block">Awaiting peer fulfillment</span>
        </div>

        {/* Fulfilled Requests */}
        <div className="rounded-3xl border border-purple-500/30 bg-[#131B2E]/70 p-5 sm:p-6 backdrop-blur-md shadow-card">
          <div className="flex items-center justify-between text-[#D8B4FE] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Fulfilled Requests</span>
            <CheckCircle2 className="h-4 w-4 text-[#38BDF8]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#D8B4FE]">{stats.fulfilled}</p>
          <span className="text-[11px] text-white/50 mt-1 block">Classmates successfully helped</span>
        </div>

        {/* Requests Posted by Me */}
        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 p-5 sm:p-6 backdrop-blur-md shadow-card">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Posted by Me</span>
            <User className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-300">{stats.myRequests}</p>
          <span className="text-[11px] text-white/50 mt-1 block">
            {currentUser?.username ? `@${currentUser.username}` : 'Your profile'}
          </span>
        </div>
      </div>

      {/* 3. TABS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            All Requests ({requests.length})
          </button>

          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'open'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Open ({stats.open})
          </button>

          <button
            onClick={() => setActiveTab('fulfilled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'fulfilled'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Fulfilled ({stats.fulfilled})
          </button>

          <button
            onClick={() => setActiveTab('my_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'my_requests'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            My Requests ({stats.myRequests})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Saved ({savedRequestIds.length})</span>
          </button>
        </div>

        {/* Sort & Filter Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#131B2E] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white">
            <ArrowUpDown className="h-3.5 w-3.5 text-white/50 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#131B2E]">Newest</option>
              <option value="oldest" className="bg-[#131B2E]">Oldest</option>
              <option value="most_responses" className="bg-[#131B2E]">Most Responses</option>
              <option value="most_popular" className="bg-[#131B2E]">Most Popular</option>
              <option value="recently_fulfilled" className="bg-[#131B2E]">Recently Fulfilled</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              showFilters || hasActiveFilters
                ? 'bg-purple-500/20 border-purple-500/50 text-[#D8B4FE]'
                : 'bg-white/5 border-white/15 text-white/70 hover:text-white'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            )}
          </button>
        </div>
      </div>

      {/* 4. SEARCH & EXPANDABLE FILTER DRAWER */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests by title, course code (23CS2101), module, topic, or tags..."
            className="w-full bg-[#131B2E] border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Grid */}
        {showFilters && (
          <div className="p-5 rounded-3xl bg-[#131B2E]/90 border border-white/10 space-y-4 animate-fadeIn backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Filter Requests
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#D8B4FE] hover:text-[#38BDF8] transition-colors"
                >
                  Reset all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Programme */}
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1">
                  Programme
                </label>
                <select
                  value={selectedProgramme}
                  onChange={(e) => setSelectedProgramme(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {PROGRAMMES.map((p) => (
                    <option key={p} value={p} className="bg-[#0B0F19]">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1">
                  Semester / Term
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s} className="bg-[#0B0F19]">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Category */}
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="All Categories" className="bg-[#0B0F19]">
                    All Categories
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0B0F19]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="All Statuses" className="bg-[#0B0F19]">All Statuses</option>
                  <option value="open" className="bg-[#0B0F19]">Open</option>
                  <option value="partially_fulfilled" className="bg-[#0B0F19]">Partially Fulfilled</option>
                  <option value="fulfilled" className="bg-[#0B0F19]">Fulfilled</option>
                  <option value="closed" className="bg-[#0B0F19]">Closed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. REQUEST CARDS FEED */}
      <div>
        {filteredRequests.length === 0 ? (
          <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/50 p-12 text-center text-white/70 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <FileQuestion className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {searchQuery || hasActiveFilters
                  ? "Couldn't find what you're looking for?"
                  : 'No requests yet in this category.'}
              </h3>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                {searchQuery || hasActiveFilters
                  ? "Couldn't find what you're looking for? Create a request and let the community help."
                  : 'No requests yet. Be the first student to ask for a resource.'}
              </p>
            </div>
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Ask for Resource ➔</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                offersCount={countsByRequestId[req.id]?.offers || 0}
                responsesCount={countsByRequestId[req.id]?.responses || 0}
                onOffersChange={loadData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
