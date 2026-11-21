'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Share2,
  Calendar,
  MessageSquare,
  Gift,
  Check,
  Clock,
  Sparkles,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { ResourceRequest } from '@/types';
import { formatDate } from '@/lib/utils';
import { useApp } from '@/lib/context/AppContext';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { RequestStatusBadge } from './RequestStatusBadge';
import OfferResourceModal from './OfferResourceModal';

interface RequestCardProps {
  request: ResourceRequest;
  offersCount?: number;
  responsesCount?: number;
  onOffersChange?: () => void;
}

export default function RequestCard({
  request,
  offersCount = 0,
  responsesCount = 0,
  onOffersChange,
}: RequestCardProps) {
  const { savedRequestIds, toggleSavedRequest, showToast } = useApp();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isSaved = savedRequestIds.includes(request.id);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/requests/${request.id}`;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('Request link copied to clipboard!', 'info');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSavedRequest(request.id);
  };

  const isFulfilled = request.status === 'fulfilled';

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between rounded-[2rem] border transition-all duration-200 p-6 sm:p-7 shadow-card ${
          isFulfilled
            ? 'bg-[#131B2E]/90 border-purple-500/40 hover:border-purple-500/70'
            : 'bg-[#131B2E]/70 border-white/10 hover:border-purple-500/40 hover:bg-[#1A243B]'
        }`}
      >
        {/* Top Bar: Requester & Badges */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* Requester Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xs font-black text-[#D8B4FE] shrink-0">
                {request.is_anonymous ? '?' : request.requester_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white truncate max-w-[150px]">
                    {request.is_anonymous ? 'Anonymous Student' : (request.requester_name || `@${request.requester_username || 'anonymous'}`)}
                  </span>
                  {!request.is_anonymous && request.requester_is_verified && (
                    <VerifiedBadge size="xs" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/50">
                  <span>{request.programme || 'B.Tech'}</span>
                  <span>•</span>
                  <span suppressHydrationWarning>{formatDate(request.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Status & Save Button */}
            <div className="flex items-center gap-2 shrink-0">
              <RequestStatusBadge status={request.status} />
              <button
                type="button"
                onClick={handleToggleSave}
                className={`p-2 rounded-xl transition border ${
                  isSaved
                    ? 'bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#f59e0b]'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save request'}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#f59e0b]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Course Banner */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-[#D8B4FE] mb-3">
            <span>{request.course_code}</span>
            <span className="text-white/40 font-sans">•</span>
            <span className="text-white/80 font-sans font-medium truncate max-w-[240px]">
              {request.course_name}
            </span>
          </div>

          {/* Request Title */}
          <Link href={`/requests/${request.id}`} className="block group-hover:underline">
            <h3 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-2">
              {request.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-white/70 line-clamp-3 mt-2 leading-relaxed">
            {request.description}
          </p>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4">
            <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white/80 text-[10px] font-bold">
              {request.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white/80 text-[10px] font-bold">
              {request.resource_type}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white/80 text-[10px] font-bold">
              {request.semester}
            </span>
            {request.module_number && (
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-[#D8B4FE] text-[10px] font-bold border border-purple-500/30">
                {request.module_number}
              </span>
            )}
            {request.preferred_format && (
              <span className="px-2.5 py-0.5 rounded-lg bg-sky-400/10 text-sky-300 text-[10px] font-bold">
                {request.preferred_format}
              </span>
            )}
            {request.deadline && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 text-[10px] font-bold">
                <Clock className="h-2.5 w-2.5" />
                Due: {request.deadline}
              </span>
            )}
          </div>

          {/* Tags */}
          {request.tags && request.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {request.tags.slice(0, 4).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] text-white/40 font-mono hover:text-[#D8B4FE] transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer: Metrics & Actions */}
        <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between gap-3">
          {/* Counters */}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5 font-bold" title="Resource Offers">
              <Gift className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span className="text-white">{offersCount}</span>
              <span className="text-[11px] text-white/50 hidden sm:inline">offers</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold" title="Discussion Comments">
              <MessageSquare className="h-3.5 w-3.5 text-white/50" />
              <span className="text-white">{responsesCount}</span>
              <span className="text-[11px] text-white/50 hidden sm:inline">replies</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition"
              title="Share Request"
            >
              {isCopied ? <Check className="h-4 w-4 text-[#38BDF8]" /> : <Share2 className="h-4 w-4" />}
            </button>

            {request.status !== 'closed' && (
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/15 hover:border-purple-500/40 flex items-center gap-1.5"
              >
                <Gift className="h-3.5 w-3.5 text-[#D8B4FE]" />
                <span className="hidden sm:inline">Offer</span>
              </button>
            )}

            <Link
              href={`/requests/${request.id}`}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition active:scale-95 flex items-center gap-1"
            >
              <span>View</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {isOfferModalOpen && (
        <OfferResourceModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          request={request}
          onSuccess={onOffersChange}
        />
      )}
    </>
  );
}
