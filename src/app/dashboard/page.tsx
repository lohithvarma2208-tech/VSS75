'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  Download,
  Heart,
  Sparkles,
  Trash2,
  Eye,
  Plus,
  ShieldCheck,
  Lock,
  Unlock,
  Gift,
  MessageSquare,
  Bookmark,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Layers,
  Trophy,
} from 'lucide-react';
import { Resource, ResourceRequest, RequestOffer } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import { formatBytes, formatDate } from '@/lib/utils';
import ResourceCard from '@/components/resources/ResourceCard';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge';
import BackgroundVideo from '@/components/common/BackgroundVideo';

export default function DashboardPage() {
  const { currentUser, showToast, openVerifyModal, savedRequestIds, openBenefitsAd } = useApp();
  const [resources, setResources] = useState<Resource[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [offers, setOffers] = useState<RequestOffer[]>([]);

  const loadData = () => {
    setResources(MockStorageManager.getResources());
    setRequests(MockStorageManager.getResourceRequests());
    setOffers(MockStorageManager.getRequestOffers());
  };

  useEffect(() => {
    loadData();

    // Trigger the benefits ad modal strictly AFTER sign in or sign up when user lands on dashboard
    if (typeof window !== 'undefined') {
      const shouldShow = sessionStorage.getItem('vss_show_benefits_ad');
      if (shouldShow === 'true') {
        sessionStorage.removeItem('vss_show_benefits_ad');
        sessionStorage.setItem('vss_seen_benefits_ad', 'true');
        setTimeout(() => {
          openBenefitsAd();
        }, 350);
      }
    }

    const handleResChange = () => setResources(MockStorageManager.getResources());
    const handleReqChange = () => setRequests(MockStorageManager.getResourceRequests());
    const handleOffChange = () => setOffers(MockStorageManager.getRequestOffers());

    window.addEventListener('klu_resources_change', handleResChange);
    window.addEventListener('klu_requests_change', handleReqChange);
    window.addEventListener('klu_offers_change', handleOffChange);

    return () => {
      window.removeEventListener('klu_resources_change', handleResChange);
      window.removeEventListener('klu_requests_change', handleReqChange);
      window.removeEventListener('klu_offers_change', handleOffChange);
    };
  }, []);

  const userUploads = resources.filter(
    (r) =>
      r.author_id === currentUser?.id ||
      r.author_name === currentUser?.full_name ||
      r.author_username === currentUser?.username
  );

  const totalDownloadsGained = userUploads.reduce((acc, r) => acc + r.downloads_count, 0);
  const totalLikesReceived = userUploads.reduce((acc, r) => acc + r.likes_count, 0);

  // User's Resource Requests
  const userRequests = requests.filter(
    (r) =>
      r.user_id === currentUser?.id ||
      r.requester_username === currentUser?.username ||
      r.requester_name === currentUser?.full_name
  );
  const openRequestsCount = userRequests.filter(
    (r) => r.status === 'open' || r.status === 'partially_fulfilled'
  ).length;
  const fulfilledRequestsCount = userRequests.filter((r) => r.status === 'fulfilled').length;
  const closedRequestsCount = userRequests.filter((r) => r.status === 'closed').length;

  // User's Contributions / Offers
  const userOffers = offers.filter(
    (o) =>
      o.contributor_id === currentUser?.id ||
      o.contributor_username === currentUser?.username ||
      o.contributor_name === currentUser?.full_name
  );
  const acceptedOffersCount = userOffers.filter((o) => o.status === 'accepted').length;
  const requestsHelpedCount = new Set(
    userOffers.filter((o) => o.status === 'accepted').map((o) => o.request_id)
  ).size;

  const handleDeleteResource = (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove "${title}"?`)) {
      MockStorageManager.deleteResource(id);
      showToast('Resource removed from Virtual Student Space', 'info');
    }
  };

  const recommendedResources = resources
    .filter((r) => !userUploads.some((u) => u.id === r.id))
    .slice(0, 3);

  return (
    <div className="px-6 sm:px-12 lg:px-16 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-[2.5rem] border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#131B2E] to-indigo-950/40 p-8 sm:p-10 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Ambient "The Vault of Knowledge" - Cinematic Master Loop */}
        <BackgroundVideo src="/videos/vault-of-knowledge.mp4" opacity={0.85} overlayStyle="obsidian" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-bold tracking-wider font-mono border border-purple-500/30">
              Student Dashboard
            </span>
            <span className="text-xs text-white/50">• {currentUser?.department}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono">
            Welcome back, @{currentUser?.username || currentUser?.code_name}!
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl font-normal">
            Track your shared assignments, review peer feedback, and discover course materials for {currentUser?.semester}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/leaderboard"
            className="px-5 py-3.5 rounded-full border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-[#D8B4FE] text-xs sm:text-sm font-extrabold shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Leaderboard 🏆</span>
          </Link>
          <button
            onClick={openBenefitsAd}
            className="px-5 py-3.5 rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-extrabold shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Why Be Active? (Ad)</span>
          </button>
          <Link
            href="/upload"
            className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition active:scale-95 flex items-center gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload New Work</span>
          </Link>
        </div>
      </div>

      {/* Institutional Email Verification Status Banner */}
      <div
        className={`p-6 sm:p-7 rounded-[2rem] border transition-all ${
          currentUser?.is_verified_student
            ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
            : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                currentUser?.is_verified_student
                  ? 'bg-purple-500/20 border-purple-500/50 text-[#D8B4FE]'
                  : 'bg-white/10 border-white/20 text-[#f59e0b]'
              }`}
            >
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">
                  {currentUser?.is_verified_student
                    ? 'Official KLEF Verified Student'
                    : 'Institutional Email Verification'}
                </h3>
                {currentUser?.is_verified_student ? (
                  <VerifiedBadge size="sm" />
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30">
                    Recommended for Uploaders
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
                {currentUser?.is_verified_student
                  ? 'Authenticated via official campus verification. Your contributions display the verified student trust badge.'
                  : 'Authenticate your enrollment with your official campus email using a 6-digit One-Time Passcode (OTP). Unlocks official Verified Student badges on your shared assignments and notes.'}
              </p>
            </div>
          </div>

          <button
            onClick={openVerifyModal}
            className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition font-mono flex items-center gap-2 ${
              currentUser?.is_verified_student
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white shadow-md shadow-indigo-500/25'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>
              {currentUser?.is_verified_student
                ? 'Manage Verification'
                : 'Verify Email via OTP'}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/80 p-6 shadow-card">
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-bold text-white/70">Resources Shared</span>
            <FileText className="h-4 w-4 text-[#D8B4FE]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{userUploads.length}</p>
          <p className="text-[11px] text-white/40 mt-1">Voluntary contributions</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/80 p-6 shadow-card">
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-bold text-white/70">Total Downloads</span>
            <Download className="h-4 w-4 text-[#38BDF8]" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalDownloadsGained}</p>
          <p className="text-[11px] text-white/40 mt-1">Peer study sessions aided</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/80 p-6 shadow-card">
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-bold text-white/70">Likes Received</span>
            <Heart className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalLikesReceived}</p>
          <p className="text-[11px] text-white/40 mt-1">Peer appreciation</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/80 p-6 shadow-card">
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-xs font-bold text-white/70">Standing</span>
            <Sparkles className="h-4 w-4 text-[#f59e0b]" />
          </div>
          <p className="text-3xl font-extrabold text-[#D8B4FE]">Active</p>
          <p className="text-[11px] text-white/40 mt-1">VSS Peer Contributor</p>
        </div>
      </div>

      {/* VSS Pro PDF Studio Unlock Progress Card */}
      <div className="p-6 sm:p-7 rounded-[2rem] border border-purple-500/30 bg-gradient-to-r from-[#131B2E] via-[#1A243B] to-[#131B2E] shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              {userUploads.length >= 5 ? (
                <Unlock className="h-6 w-6 text-[#D8B4FE]" />
              ) : (
                <Lock className="h-6 w-6 text-[#f59e0b]" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">
                  VSS Pro PDF Studio
                </h3>
                {userUploads.length >= 5 ? (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white">
                    ✓ UNLOCKED (Tier 1 Contributor Privilege)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-[#f59e0b] border border-amber-500/30">
                    {Math.max(0, 5 - userUploads.length)} More Uploads to Unlock
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 max-w-xl leading-relaxed">
                Free student utility for merging lab records, extracting pages, batch rotating phone scans, and applying official KLEF registration watermarks.
              </p>

              {/* Progress bar */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <div className="h-2 w-48 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] transition-all duration-300"
                    style={{ width: `${Math.min(100, (userUploads.length / 5) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[#D8B4FE] font-bold">
                  {userUploads.length} / 5 Verified Submissions
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/pdf-studio"
            className={`shrink-0 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition active:scale-95 flex items-center gap-2 ${
              userUploads.length >= 5
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            {userUploads.length >= 5 ? (
              <>
                <Unlock className="h-4 w-4" />
                <span>Open Pro PDF Studio</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>View PDF Studio Perk</span>
              </>
            )}
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RESOURCE REQUESTS & COMMUNITY CONTRIBUTIONS                    */}
      {/* ============================================================== */}
      <div className="space-y-6">
        {/* Section Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-mono font-bold tracking-wider border border-purple-500/30">
                COMMUNITY SHARING
              </span>
              <span className="text-xs text-white/50">Student-to-Student Assistance</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Resource Requests &amp; Contributions
            </h2>
            <p className="text-xs text-white/60">
              Track materials you have requested and academic resources you offered to help classmates.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/requests/new"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-black shadow-md shadow-indigo-500/25 transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Request</span>
            </Link>

            <Link
              href="/requests"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/15 flex items-center gap-1.5"
            >
              <Layers className="h-3.5 w-3.5 text-[#D8B4FE]" />
              <span>Browse Requests</span>
            </Link>

            <Link
              href="/requests"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/15 flex items-center gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span>Saved ({savedRequestIds.length})</span>
            </Link>
          </div>
        </div>

        {/* Dual Cards Grid: My Requests vs My Contributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: My Resource Requests */}
          <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/80 p-7 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    My Resource Requests ({userRequests.length})
                  </h3>
                  <span className="text-[11px] text-white/50">Academic materials you asked for</span>
                </div>
              </div>

              <Link
                href="/requests/new"
                className="text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] flex items-center gap-1 transition-colors"
              >
                <span>+ Ask</span>
              </Link>
            </div>

            {/* Micro Stats Bar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-[#0B0F19]/80 border border-white/10 text-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase">Open</span>
                <span className="text-lg font-black text-amber-300">{openRequestsCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0B0F19]/80 border border-white/10 text-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase">Fulfilled</span>
                <span className="text-lg font-black text-[#D8B4FE]">{fulfilledRequestsCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0B0F19]/80 border border-white/10 text-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase">Closed</span>
                <span className="text-lg font-black text-white/50">{closedRequestsCount}</span>
              </div>
            </div>

            {/* List of Requests */}
            {userRequests.length === 0 ? (
              <div className="text-center py-8 text-white/50 space-y-2">
                <p className="text-xs">You haven’t created any resource requests yet.</p>
                <Link
                  href="/requests/new"
                  className="inline-flex text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] transition-colors"
                >
                  Create your first request ➔
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {userRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-[#0B0F19]/70 border border-white/10 hover:border-purple-500/30 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-purple-500/15 text-[#D8B4FE] text-[10px] font-mono font-bold">
                          {req.course_code}
                        </span>
                        <RequestStatusBadge status={req.status} size="sm" />
                      </div>
                      <Link
                        href={`/requests/${req.id}`}
                        className="text-xs font-bold text-white group-hover:text-[#D8B4FE] truncate block transition"
                      >
                        {req.title}
                      </Link>
                      <span className="text-[10px] text-white/40">{formatDate(req.created_at)}</span>
                    </div>

                    <Link
                      href={`/requests/${req.id}`}
                      className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 shrink-0 transition"
                      title="View Request"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}

                {userRequests.length > 3 && (
                  <Link
                    href="/requests"
                    className="block text-center text-xs font-bold text-white/60 hover:text-white pt-1"
                  >
                    View all {userRequests.length} requests ➔
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Card 2: My Contributions */}
          <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/80 p-7 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    My Contributions ({userOffers.length})
                  </h3>
                  <span className="text-[11px] text-white/50">Academic resources you offered</span>
                </div>
              </div>

              <Link
                href="/requests"
                className="text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] flex items-center gap-1 transition-colors"
              >
                <span>Fulfill Requests ➔</span>
              </Link>
            </div>

            {/* Micro Stats Bar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-[#0B0F19]/80 border border-white/10 text-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase">Offered</span>
                <span className="text-lg font-black text-white">{userOffers.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0B0F19]/80 border border-white/10 text-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase">Accepted</span>
                <span className="text-lg font-black text-[#38BDF8]">{acceptedOffersCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#0B0F19]/80 border border-white/10 text-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase">Helped</span>
                <span className="text-lg font-black text-sky-300">{requestsHelpedCount}</span>
              </div>
            </div>

            {/* List of Offers */}
            {userOffers.length === 0 ? (
              <div className="text-center py-8 text-white/50 space-y-2">
                <p className="text-xs">You haven’t offered resources to classmates yet.</p>
                <Link
                  href="/requests"
                  className="inline-flex text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] transition-colors"
                >
                  Browse open requests to help ➔
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {userOffers.slice(0, 3).map((offer) => (
                  <div
                    key={offer.id}
                    className="p-3.5 rounded-2xl bg-[#0B0F19]/70 border border-white/10 hover:border-purple-500/30 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono">
                          {offer.offer_type === 'upload'
                            ? '📁 Upload'
                            : offer.offer_type === 'existing_resource'
                            ? '📚 VSS'
                            : '🔗 Link'}
                        </span>
                        {offer.status === 'accepted' ? (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-[#38BDF8] text-[10px] font-bold">
                            ✓ Accepted Solution
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[10px]">
                            {offer.status}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/requests/${offer.request_id}`}
                        className="text-xs font-bold text-white group-hover:text-[#D8B4FE] truncate block transition"
                      >
                        {offer.title}
                      </Link>
                      <span className="text-[10px] text-white/40">{formatDate(offer.created_at)}</span>
                    </div>

                    <Link
                      href={`/requests/${offer.request_id}`}
                      className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 shrink-0 transition"
                      title="View Request"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}

                {userOffers.length > 3 && (
                  <Link
                    href="/requests"
                    className="block text-center text-xs font-bold text-white/60 hover:text-white pt-1"
                  >
                    View all {userOffers.length} offers ➔
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Resources List */}
      <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/80 p-8 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Your Uploaded Materials</h2>
            <p className="text-xs text-white/60 mt-0.5">Manage and update resources you’ve published</p>
          </div>
          <Link
            href="/upload"
            className="text-xs font-bold text-[#D8B4FE] hover:text-[#38BDF8] flex items-center gap-1 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Resource</span>
          </Link>
        </div>

        {userUploads.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-white/15 bg-white/5">
            <UploadCloud className="h-10 w-10 text-white/30 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No resources uploaded yet</p>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 mb-5">
              Share an assignment, lab record, or notes to help fellow classmates.
            </p>
            <Link
              href="/upload"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition"
            >
              Share Your First Resource
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {userUploads.map((res) => (
              <div
                key={res.id}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30">
                      {res.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-full">
                      {res.course_code}
                    </span>
                    <span className="text-[11px] text-white/40">• {formatDate(res.created_at)}</span>
                  </div>
                  <Link
                    href={`/resource/${res.id}`}
                    className="font-bold text-base text-white hover:text-[#D8B4FE] transition block"
                  >
                    {res.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span>{res.downloads_count} downloads</span>
                    <span>•</span>
                    <span>{res.likes_count} likes</span>
                    <span>•</span>
                    <span>{formatBytes(res.file_size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/resource/${res.id}`}
                    className="px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5 text-white/60" />
                    <span>View</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteResource(res.id, res.title)}
                    className="p-2 rounded-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs transition"
                    title="Remove resource"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended for You */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-white tracking-tight">Recommended for Your Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedResources.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      </div>
    </div>
  );
}
