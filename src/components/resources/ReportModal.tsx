'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
}

export default function ReportModal({ isOpen, onClose, resource }: ReportModalProps) {
  const { currentUser, showToast } = useApp();
  const [reason, setReason] = useState<
    'copyright' | 'inappropriate' | 'wrong_category' | 'spam' | 'personal_info' | 'misconduct' | 'other'
  >('misconduct');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide details for moderation review.', 'error');
      return;
    }

    setIsSubmitting(true);
    MockStorageManager.addReport({
      resource_id: resource.id,
      resource_title: resource.title,
      reported_by: currentUser?.id || 'anon-reporter',
      reporter_username: currentUser?.username || 'anonymous',
      reason,
      description: description.trim(),
    });

    setIsSubmitting(false);
    showToast('Report submitted for campus moderation review.', 'success');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-[2.5rem] bg-[#0D1527] shadow-2xl border border-white/15 overflow-hidden text-white">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              Report Academic Resource
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#f59e0b]" />
            <span>
              Reports are audited by KLU student moderators and faculty administrators. Please report valid concerns only.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1">
              Resource:
            </label>
            <p className="text-xs text-white/90 font-medium truncate">{resource.title}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1">
              Reason for Report:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="misconduct" className="bg-[#0B0F19]">Academic Misconduct / Cheating Material</option>
              <option value="copyright" className="bg-[#0B0F19]">Copyright Infringement / Unauthorized Work</option>
              <option value="personal_info" className="bg-[#0B0F19]">Personal / Confidential Student Information</option>
              <option value="wrong_category" className="bg-[#0B0F19]">Wrong Category or Course Code</option>
              <option value="spam" className="bg-[#0B0F19]">Spam / Corrupted File / Irrelevant Upload</option>
              <option value="inappropriate" className="bg-[#0B0F19]">Inappropriate / Harmful Content</option>
              <option value="other" className="bg-[#0B0F19]">Other Concern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1">
              Specific Details:
            </label>
            <textarea
              rows={3}
              placeholder="Explain the issue clearly..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-[#0B0F19] p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
