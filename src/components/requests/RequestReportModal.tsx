'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';

interface RequestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  offerId?: string;
  responseId?: string;
}

export default function RequestReportModal({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  offerId,
  responseId,
}: RequestReportModalProps) {
  const { currentUser, showToast } = useApp();
  const [reason, setReason] = useState<
    'copyright' | 'inappropriate' | 'wrong_category' | 'spam' | 'personal_info' | 'misconduct' | 'other'
  >('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide details for the report.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      MockStorageManager.addRequestReport({
        request_id: requestId,
        offer_id: offerId,
        response_id: responseId,
        reporter_id: currentUser?.id || 'usr-anonymous',
        reporter_username: currentUser?.username || 'anonymous_student',
        reason,
        description: description.trim(),
      });

      showToast('Report submitted. Campus moderators will review it shortly.', 'success');
      setDescription('');
      onClose();
    } catch {
      showToast('Failed to submit report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0D1527] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Report Content</h3>
            <p className="text-xs text-white/60 truncate max-w-[260px]">
              {offerId ? 'Report Offer' : responseId ? 'Report Comment' : requestTitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="spam">Spam / Duplicate Request</option>
              <option value="inappropriate">Inappropriate / Harmful Content</option>
              <option value="misconduct">Academic Misconduct / Cheating Request</option>
              <option value="wrong_category">Wrong Course / Misleading Details</option>
              <option value="copyright">Copyright Infringement</option>
              <option value="personal_info">Contains Private / Personal Information</option>
              <option value="other">Other Campus Policy Violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Description / Evidence
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why this content violates academic integrity or community guidelines..."
              className="w-full bg-[#0B0F19] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" />
            <span>
              All reports are confidential and audited by KL University peer moderators to uphold academic standards.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-bold transition disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
