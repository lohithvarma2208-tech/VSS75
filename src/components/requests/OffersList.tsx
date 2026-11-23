'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Download,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { RequestOffer, ResourceRequest } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import { formatDate, formatBytes, triggerBrowserDownload } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import RequestReportModal from './RequestReportModal';

interface OffersListProps {
  offers: RequestOffer[];
  request: ResourceRequest;
  onOffersChange: () => void;
}

export default function OffersList({ offers, request, onOffersChange }: OffersListProps) {
  const { currentUser, showToast } = useApp();
  const [reportOfferId, setReportOfferId] = useState<string | null>(null);

  const isOwner = currentUser?.id === request.user_id;

  const handleAcceptOffer = (offerId: string) => {
    try {
      MockStorageManager.updateOfferStatus(offerId, 'accepted');
      showToast('Offer accepted! Request marked as fulfilled.', 'success');
      onOffersChange();
    } catch {
      showToast('Failed to accept offer.', 'error');
    }
  };

  const handleRejectOffer = (offerId: string) => {
    try {
      MockStorageManager.updateOfferStatus(offerId, 'rejected');
      showToast('Offer declined.', 'info');
      onOffersChange();
    } catch {
      showToast('Failed to decline offer.', 'error');
    }
  };

  const handleDownloadUploadedFile = async (offer: RequestOffer) => {
    const filename = offer.uploaded_file_name || 'klu_resource.pdf';
    const targetUrl = offer.uploaded_file_url || (offer.resource_id ? `/samples/${filename}` : '');
    const ok = await triggerBrowserDownload(filename, targetUrl, undefined, undefined, {
      id: offer.resource_id,
      title: offer.title,
    });
    if (ok) {
      showToast(`Downloaded ${filename}`, 'success');
    } else {
      showToast('Original PDF unavailable. Please try again later.', 'error');
    }
  };

  if (offers.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#131B2E]/40 p-8 sm:p-12 text-center text-white/70 space-y-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
          <BookOpen className="h-6 w-6" />
        </div>
        <h4 className="text-base font-bold text-white">No Resource Offers Yet</h4>
        <p className="text-xs text-white/60 max-w-md mx-auto">
          Have notes, lab experiments, or question papers that can assist this classmate? Be the first to share your academic material!
        </p>
      </div>
    );
  }

  // Sort offers: accepted offers first, then newest
  const sortedOffers = [...offers].sort((a, b) => {
    if (a.status === 'accepted' && b.status !== 'accepted') return -1;
    if (b.status === 'accepted' && a.status !== 'accepted') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedOffers.map((offer) => {
        const isAccepted = offer.status === 'accepted';
        const isRejected = offer.status === 'rejected';

        return (
          <div
            key={offer.id}
            className={`relative rounded-3xl border transition-all p-5 sm:p-6 ${
              isAccepted
                ? 'bg-[#131B2E] border-purple-500/70 shadow-lg shadow-purple-500/20'
                : 'bg-[#131B2E]/70 border-white/10 hover:border-purple-500/40 hover:bg-[#1A243B]'
            }`}
          >
            {/* Accepted Banner */}
            {isAccepted && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-xs font-black tracking-wide mb-4 shadow-md">
                <Award className="h-3.5 w-3.5" />
                <span>ACCEPTED SOLUTION BY REQUESTER</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              {/* Contributor Profile */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm font-black text-[#D8B4FE] shrink-0">
                  {(offer.contributor_name || offer.contributor_username || 'U').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {offer.contributor_name || `@${offer.contributor_username}`}
                    </span>
                    {offer.contributor_is_verified && <VerifiedBadge size="xs" />}
                    <span className="text-[10px] text-white/50">
                      @{offer.contributor_username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/50">
                    <span>{offer.contributor_department || 'Engineering'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {formatDate(offer.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Offer Type Badge */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-mono font-bold border border-white/15">
                  {offer.offer_type === 'upload'
                    ? '📁 Uploaded File'
                    : offer.offer_type === 'existing_resource'
                    ? '📚 VSS Library Resource'
                    : '🔗 External Link'}
                </span>
                {isRejected && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                    Declined
                  </span>
                )}
              </div>
            </div>

            {/* Offer Content */}
            <div className="py-4 space-y-3">
              <div>
                <h4 className="text-sm sm:base font-extrabold text-white">
                  {offer.title}
                </h4>
                {offer.description && (
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    {offer.description}
                  </p>
                )}
              </div>

              {/* Contributor Message */}
              {offer.message && (
                <div className="p-3.5 rounded-2xl bg-[#0B0F19]/90 border border-white/10 text-xs text-white/80 flex items-start gap-2.5">
                  <MessageSquare className="h-4 w-4 text-[#D8B4FE] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-white/50 block mb-0.5">
                      Note from contributor:
                    </span>
                    <p className="italic text-white/90">{offer.message}</p>
                  </div>
                </div>
              )}

              {/* Attached Resource Action */}
              <div className="pt-2">
                {offer.offer_type === 'upload' && (
                  <button
                    onClick={() => handleDownloadUploadedFile(offer)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B0F19] hover:bg-[#1A243B] text-white text-xs font-bold transition border border-white/15 hover:border-purple-500/40"
                  >
                    <Download className="h-3.5 w-3.5 text-[#38BDF8]" />
                    <span>Download {offer.uploaded_file_name || 'Resource File'}</span>
                    {offer.uploaded_file_size && (
                      <span className="text-[10px] text-white/50">
                        ({formatBytes(offer.uploaded_file_size)})
                      </span>
                    )}
                  </button>
                )}

                {offer.offer_type === 'existing_resource' && offer.resource_id && (
                  <Link
                    href={`/resource/${offer.resource_id}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-[#D8B4FE] text-xs font-bold transition border border-purple-500/30"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>View VSS Resource in Library</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}

                {offer.offer_type === 'external_link' && offer.external_url && (
                  <a
                    href={offer.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B0F19] hover:bg-[#1A243B] text-white text-xs font-bold transition border border-white/15 hover:border-purple-500/40 break-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#38BDF8]" />
                    <span className="truncate max-w-sm">{offer.external_url}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Owner Actions / Moderation */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReportOfferId(offer.id)}
                  className="text-[11px] text-white/40 hover:text-white/70 transition flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Report</span>
                </button>
              </div>

              {/* Only the Request Owner can accept/reject */}
              {isOwner && !isAccepted && (
                <div className="flex items-center gap-2">
                  {!isRejected && (
                    <button
                      type="button"
                      onClick={() => handleRejectOffer(offer.id)}
                      className="px-3 py-1.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/10 text-xs font-semibold transition"
                    >
                      Decline
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAcceptOffer(offer.id)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Accept Offer ✓</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {reportOfferId && (
        <RequestReportModal
          isOpen={Boolean(reportOfferId)}
          onClose={() => setReportOfferId(null)}
          requestId={request.id}
          requestTitle={request.title}
          offerId={reportOfferId}
        />
      )}
    </div>
  );
}
