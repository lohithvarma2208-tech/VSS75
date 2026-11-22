'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bookmark,
  Share2,
  Gift,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Edit2,
  AlertTriangle,
  Check,
  Tag,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { ResourceRequest, RequestOffer, RequestResponse } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import { formatDate } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge';
import OfferResourceModal from '@/components/requests/OfferResourceModal';
import OffersList from '@/components/requests/OffersList';
import DiscussionSection from '@/components/requests/DiscussionSection';
import RequestReportModal from '@/components/requests/RequestReportModal';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  const { currentUser, savedRequestIds, toggleSavedRequest, showToast } = useApp();

  const [request, setRequest] = useState<ResourceRequest | null>(null);
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [responses, setResponses] = useState<RequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & UI States
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Owner Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const loadData = () => {
    if (!requestId) return;
    const req = MockStorageManager.getResourceRequestById(requestId);
    if (req) {
      setRequest(req);
      setEditTitle(req.title);
      setEditDescription(req.description);
      setEditTopic(req.topic || '');
      setEditDeadline(req.deadline || '');
      setOffers(MockStorageManager.getRequestOffers(requestId));
      setResponses(MockStorageManager.getRequestResponses(requestId));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    const handleReqChange = () => {
      const updated = MockStorageManager.getResourceRequestById(requestId);
      if (updated) setRequest(updated);
    };
    const handleOffChange = () => setOffers(MockStorageManager.getRequestOffers(requestId));
    const handleRespChange = () => setResponses(MockStorageManager.getRequestResponses(requestId));

    window.addEventListener('klu_requests_change', handleReqChange);
    window.addEventListener('klu_offers_change', handleOffChange);
    window.addEventListener('klu_request_responses_change', handleRespChange);

    return () => {
      window.removeEventListener('klu_requests_change', handleReqChange);
      window.removeEventListener('klu_offers_change', handleOffChange);
      window.removeEventListener('klu_request_responses_change', handleRespChange);
    };
  }, [requestId]);

  // Ownership & Permissions Check
  const isOwner = useMemo(() => {
    if (!currentUser || !request) return false;
    return (
      currentUser.id === request.user_id ||
      currentUser.username === request.requester_username ||
      currentUser.role === 'admin'
    );
  }, [currentUser, request]);

  const isSaved = savedRequestIds.includes(requestId);

  const handleToggleSave = () => {
    toggleSavedRequest(requestId);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      showToast('Link copied to clipboard!', 'info');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Status Change Actions (Verified against owner)
  const handleUpdateStatus = (newStatus: 'open' | 'fulfilled' | 'closed' | 'partially_fulfilled') => {
    if (!isOwner) {
      showToast('Permission denied. Only the request owner can update status.', 'error');
      return;
    }
    MockStorageManager.updateRequestStatus(requestId, newStatus);
    showToast(`Request marked as ${newStatus.replace('_', ' ')}.`, 'success');
    loadData();
  };

  const handleDeleteRequest = () => {
    if (!isOwner) {
      showToast('Permission denied. Only the request owner can delete.', 'error');
      return;
    }
    if (confirm('Are you sure you want to permanently delete this resource request?')) {
      MockStorageManager.deleteResourceRequest(requestId);
      showToast('Resource request deleted.', 'info');
      router.push('/requests');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showToast('Permission denied.', 'error');
      return;
    }
    if (!editTitle.trim() || !editDescription.trim()) {
      showToast('Title and description cannot be empty.', 'error');
      return;
    }

    MockStorageManager.updateResourceRequest(requestId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      topic: editTopic.trim() || undefined,
      deadline: editDeadline || undefined,
    });

    setIsEditing(false);
    showToast('Request details updated.', 'success');
    loadData();
  };

  if (isLoading) {
    return (
      <div className="px-6 py-20 text-center text-white/50 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs">Loading request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="px-6 py-20 text-center text-white space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Request Not Found</h2>
        <p className="text-xs text-white/60">
          This resource request may have been removed or does not exist.
        </p>
        <Link
          href="/requests"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white font-bold text-xs shadow-md shadow-indigo-500/25"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requests Feed</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/requests"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-[#D8B4FE] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requests Feed</span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl bg-[#131B2E]/80 hover:bg-[#1A243B] text-white/80 hover:text-white text-xs font-bold transition border border-white/10 flex items-center gap-1.5"
          >
            {isCopied ? <Check className="h-4 w-4 text-[#38BDF8]" /> : <Share2 className="h-4 w-4" />}
            <span>{isCopied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleToggleSave}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
              isSaved
                ? 'bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#f59e0b]'
                : 'bg-[#131B2E]/80 border-white/10 text-white/70 hover:text-white hover:bg-[#1A243B]'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#f59e0b]' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Report */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-300 transition border border-white/10"
            title="Report this request"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Request Header Card */}
      <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/70 backdrop-blur-xl p-7 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Course & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-purple-500/15 text-[#D8B4FE] font-mono font-bold text-xs border border-purple-500/30">
                {request.course_code}
              </span>
              <span className="text-xs font-bold text-white/80">{request.course_name}</span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/60">{request.programme}</span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/60">{request.semester}</span>
            </div>

            <RequestStatusBadge status={request.status} size="md" />
          </div>

          {/* Title & Description */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Request Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Topic / Sub-topic
                  </label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-black shadow-md shadow-indigo-500/25"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {request.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal whitespace-pre-line">
                {request.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-[#0B0F19]/60 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Category</span>
              <span className="text-xs font-extrabold text-white mt-0.5 block">{request.category}</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B0F19]/60 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Resource Type</span>
              <span className="text-xs font-extrabold text-white mt-0.5 block">{request.resource_type}</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B0F19]/60 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Preferred Format</span>
              <span className="text-xs font-extrabold text-[#38BDF8] mt-0.5 block">
                {request.preferred_format || 'Any Format'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B0F19]/60 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/50 block">Due / Exam Date</span>
              <span className="text-xs font-extrabold text-rose-300 mt-0.5 block">
                {request.deadline || 'No hard deadline'}
              </span>
            </div>
          </div>

          {/* Module / Topic / Assignment Badges */}
          {(request.module_number || request.topic || request.assignment_number) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {request.module_number && (
                <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10">
                  {request.module_number}
                </span>
              )}
              {request.topic && (
                <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10">
                  Topic: {request.topic}
                </span>
              )}
              {request.assignment_number && (
                <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10">
                  {request.assignment_number}
                </span>
              )}
            </div>
          )}

          {/* Requester Profile & CTA Banner */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm font-black text-[#D8B4FE]">
                {request.is_anonymous ? '?' : request.requester_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {request.is_anonymous ? 'Anonymous' : (request.requester_name.startsWith('@') ? request.requester_name : `@${request.requester_username || request.requester_name}`)}
                  </span>
                  {!request.is_anonymous && request.requester_is_verified && <VerifiedBadge size="xs" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/50">
                  <span>{request.requester_department || 'Engineering'}</span>
                  <span>•</span>
                  <span>Posted {formatDate(request.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Fulfill CTA Button */}
            {request.status !== 'closed' && (
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition active:scale-95 flex items-center gap-2"
              >
                <Gift className="h-4 w-4" />
                <span>Offer Resource to Classmate ➔</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REQUEST OWNER MANAGEMENT CONSOLE (Owner Only) */}
      {isOwner && (
        <div className="rounded-3xl border border-purple-500/30 bg-[#131B2E]/90 p-5 sm:p-6 text-white space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D8B4FE]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Requester Management Controls (Owner Only)
              </h3>
            </div>
            <span className="text-[10px] text-[#D8B4FE] font-mono">AUTHORIZED AS OWNER</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Edit */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Request</span>
              </button>
            )}

            {/* Mark Fulfilled */}
            {request.status !== 'fulfilled' && (
              <button
                onClick={() => handleUpdateStatus('fulfilled')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-[#D8B4FE] border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark as Fulfilled</span>
              </button>
            )}

            {/* Reopen Request */}
            {request.status !== 'open' && (
              <button
                onClick={() => handleUpdateStatus('open')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reopen Request</span>
              </button>
            )}

            {/* Close Request */}
            {request.status !== 'closed' && (
              <button
                onClick={() => handleUpdateStatus('closed')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Close Request</span>
              </button>
            )}

            {/* Delete Request */}
            <button
              onClick={handleDeleteRequest}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* OFFERS SECTION */}
      <div className="space-y-4 pt-4" id="offers">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#D8B4FE]" />
              <span>Resource Offers ({offers.length})</span>
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              Resources and reference materials offered by fellow KL University students.
            </p>
          </div>

          {request.status !== 'closed' && (
            <button
              type="button"
              onClick={() => setIsOfferModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#131B2E]/80 hover:bg-[#1A243B] text-white text-xs font-bold transition border border-white/15 hover:border-purple-500/40 flex items-center gap-1.5"
            >
              <Gift className="h-3.5 w-3.5 text-[#D8B4FE]" />
              <span>Offer Resource</span>
            </button>
          )}
        </div>

        <OffersList offers={offers} request={request} onOffersChange={loadData} />
      </div>

      {/* DISCUSSION & REPLIES SECTION */}
      <div className="space-y-4 pt-6 border-t border-white/10" id="discussion">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sky-400" />
            <span>Discussion &amp; Inquiries ({responses.length})</span>
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Coordinate notes details, clarify questions, and help classmates study.
          </p>
        </div>

        <DiscussionSection
          requestId={request.id}
          requestTitle={request.title}
          responses={responses}
          onResponsesChange={loadData}
        />
      </div>

      {/* Modals */}
      {isOfferModalOpen && (
        <OfferResourceModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          request={request}
          onSuccess={loadData}
        />
      )}

      {isReportModalOpen && (
        <RequestReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          requestId={request.id}
          requestTitle={request.title}
        />
      )}
    </div>
  );
}
