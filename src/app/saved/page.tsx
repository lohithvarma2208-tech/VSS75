'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Bookmark, Search, Compass, FileQuestion } from 'lucide-react';
import { Resource, ResourceRequest } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import ResourceCard from '@/components/resources/ResourceCard';
import RequestCard from '@/components/requests/RequestCard';

export default function SavedResourcesPage() {
  const { savedIds, savedRequestIds } = useApp();
  const [activeTab, setActiveTab] = useState<'resources' | 'requests'>('resources');
  const [resources, setResources] = useState<Resource[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setResources(MockStorageManager.getResources());
    setRequests(MockStorageManager.getResourceRequests());
  };

  useEffect(() => {
    loadData();
    const handleResChange = () => setResources(MockStorageManager.getResources());
    const handleReqChange = () => setRequests(MockStorageManager.getResourceRequests());

    window.addEventListener('klu_resources_change', handleResChange);
    window.addEventListener('klu_requests_change', handleReqChange);

    return () => {
      window.removeEventListener('klu_resources_change', handleResChange);
      window.removeEventListener('klu_requests_change', handleReqChange);
    };
  }, []);

  const savedResources = useMemo(() => {
    let result = resources.filter((r) => savedIds.includes(r.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.course_code || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [resources, savedIds, searchQuery]);

  const savedRequestsList = useMemo(() => {
    let result = requests.filter((r) => savedRequestIds.includes(r.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.course_code || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q) ||
          (r.topic && r.topic.toLowerCase().includes(q))
      );
    }
    return result;
  }, [requests, savedRequestIds, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-[#f59e0b] fill-[#f59e0b]" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Saved Bookmarks
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-white/70 mt-1 font-normal">
            Academic materials and community resource requests bookmarked for revision and review.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-3 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search saved..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-full border border-white/15 bg-[#131B2E] pl-10 pr-4 text-xs text-white focus:outline-none focus:border-purple-500 shadow-card"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'resources'
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          Saved Resources ({savedIds.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md shadow-indigo-500/25'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileQuestion className="h-3.5 w-3.5" />
          <span>Saved Requests ({savedRequestIds.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'resources' ? (
        savedResources.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/50">
            <Bookmark className="h-12 w-12 text-white/30 mx-auto mb-3" />
            <h2 className="text-base font-bold text-white">No Saved Resources Yet</h2>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 mb-6">
              When you discover useful lab records or study notes in Explore, click the bookmark icon to save them here for quick revision.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition"
            >
              <Compass className="h-4 w-4" />
              <span>Discover Resources</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedResources.map((res) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        )
      ) : savedRequestsList.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/50">
          <FileQuestion className="h-12 w-12 text-white/30 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white">No Saved Requests Yet</h2>
          <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 mb-6">
            Bookmark requests from classmates so you can follow responses or upload notes once you find them.
          </p>
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition"
          >
            <span>Browse Requests Feed</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedRequestsList.map((req) => (
            <RequestCard key={req.id} request={req} onOffersChange={loadData} />
          ))}
        </div>
      )}
    </div>
  );
}
