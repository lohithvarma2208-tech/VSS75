'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
} from 'lucide-react';
import { ResourceRequest, OfferType, Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import { formatBytes } from '@/lib/utils';

interface OfferResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ResourceRequest;
  onSuccess?: () => void;
}

export default function OfferResourceModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: OfferResourceModalProps) {
  const { currentUser, showToast } = useApp();
  const [offerType, setOfferType] = useState<OfferType>('upload');

  // Option A: Upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');

  // Option B: Existing Resource
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [resourceSearch, setResourceSearch] = useState('');

  // Option C: External Link
  const [externalUrl, setExternalUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  // Common: Note to requester
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const allResources = useMemo(() => {
    return MockStorageManager.getResources();
  }, []);

  const filteredResources = useMemo(() => {
    const q = resourceSearch.toLowerCase().trim();
    return allResources.filter((r) => {
      const matchQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.course_code.toLowerCase().includes(q) ||
        r.course_name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      return matchQuery;
    });
  }, [allResources, resourceSearch]);

  const selectedResource = useMemo(() => {
    return allResources.find((r) => r.id === selectedResourceId);
  }, [allResources, selectedResourceId]);

  if (!isOpen) return null;

  // Safe URL validation for Option C
  const isValidSafeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url.trim());
      // Enforce only http or https protocols; strictly forbid javascript:, data:, file:, etc.
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!uploadTitle) {
        setUploadTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      showToast('Please sign in to offer a resource.', 'error');
      return;
    }

    if (offerType === 'upload') {
      if (!uploadTitle.trim()) {
        setErrorMsg('Please provide a resource title.');
        return;
      }
      if (!file) {
        setErrorMsg('Please select a file to upload.');
        return;
      }
    } else if (offerType === 'existing_resource') {
      if (!selectedResourceId) {
        setErrorMsg('Please select an existing resource from the library.');
        return;
      }
    } else if (offerType === 'external_link') {
      if (!linkTitle.trim()) {
        setErrorMsg('Please provide a title for the external resource.');
        return;
      }
      if (!externalUrl.trim()) {
        setErrorMsg('Please enter the URL.');
        return;
      }
      if (!isValidSafeUrl(externalUrl)) {
        setErrorMsg('Invalid URL. Only secure http:// and https:// links are permitted.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let finalTitle = '';
      let finalDesc = '';
      let uploadedFileName = '';
      let uploadedFileType = undefined;
      let uploadedFileSize = 0;

      if (offerType === 'upload') {
        finalTitle = uploadTitle.trim();
        finalDesc = uploadDesc.trim();
        uploadedFileName = file ? file.name : 'academic_resource.pdf';
        const ext = uploadedFileName.split('.').pop()?.toLowerCase();
        uploadedFileType = (ext as any) || 'pdf';
        uploadedFileSize = file ? file.size : 120400;
      } else if (offerType === 'existing_resource') {
        finalTitle = selectedResource ? selectedResource.title : 'VSS Library Resource';
        finalDesc = selectedResource ? selectedResource.description : '';
      } else {
        finalTitle = linkTitle.trim();
        finalDesc = `External Link: ${externalUrl.trim()}`;
      }

      MockStorageManager.addRequestOffer({
        request_id: request.id,
        contributor_id: currentUser.id,
        contributor_name: currentUser.code_name || `@${currentUser.username}`,
        contributor_username: currentUser.username,
        contributor_avatar: currentUser.avatar_url,
        contributor_department: currentUser.department,
        contributor_is_verified: currentUser.is_verified_student,
        offer_type: offerType,
        resource_id: offerType === 'existing_resource' ? selectedResourceId : undefined,
        uploaded_file_name: offerType === 'upload' ? uploadedFileName : undefined,
        uploaded_file_url: offerType === 'upload' ? '/samples/23CS2101_Exp5_AVL_Trees_LabRecord.pdf' : undefined,
        uploaded_file_type: uploadedFileType,
        uploaded_file_size: uploadedFileSize,
        external_url: offerType === 'external_link' ? externalUrl.trim() : undefined,
        title: finalTitle,
        description: finalDesc,
        message: message.trim(),
      });

      showToast('Thank you! Your resource offer has been submitted to the student.', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to submit offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0D1527] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-mono font-bold border border-purple-500/30">
              Fulfill Request
            </span>
            <span className="text-xs text-white/50 font-mono">{request.course_code}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Offer Resource to Help Classmate
          </h2>
          <p className="text-xs text-white/70 line-clamp-1 mt-1">
            Request: &quot;{request.title}&quot;
          </p>
        </div>

        {/* 3 Offer Mode Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#0B0F19] border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setOfferType('upload');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              offerType === 'upload'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload New</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOfferType('existing_resource');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              offerType === 'existing_resource'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Existing VSS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOfferType('external_link');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              offerType === 'external_link'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            <span>External Link</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: UPLOAD NEW RESOURCE */}
          {offerType === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Resource Title <span className="text-[#D8B4FE]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={`e.g. ${request.course_code} ${request.topic || request.resource_type} Notes`}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Upload File (PDF, PPTX, DOCX, Code, Images){' '}
                  <span className="text-[#D8B4FE]">*</span>
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-5 cursor-pointer bg-[#0B0F19]/60 transition">
                  <Upload className="h-8 w-8 text-[#D8B4FE] mb-2" />
                  <span className="text-xs font-bold text-white">
                    {file ? file.name : 'Click to select or drop academic file'}
                  </span>
                  <span className="text-[10px] text-white/50 mt-1">
                    {file ? `${formatBytes(file.size)} selected` : 'Supports PDF, PPTX, DOCX, ZIP, PY, JAVA (Max 25MB)'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.pptx,.ppt,.docx,.doc,.zip,.py,.java,.cpp,.c,.txt,.png,.jpg"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Brief Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Outline key contents, experiments covered, or semester exam tips..."
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SHARE EXISTING VSS RESOURCE */}
          {offerType === 'existing_resource' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Search & Select From VSS Academic Library <span className="text-[#D8B4FE]">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search by title, course code (e.g. 23CS2101)..."
                    className="w-full bg-[#0B0F19] border border-white/15 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredResources.map((res) => {
                  const isSelected = selectedResourceId === res.id;
                  return (
                    <div
                      key={res.id}
                      onClick={() => setSelectedResourceId(res.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-500/15 border-purple-500'
                          : 'bg-[#0B0F19]/60 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#D8B4FE]' : 'text-white/50'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-white">
                            {res.title}
                          </p>
                          <p className="text-[10px] text-white/60">
                            {res.course_code} · {res.category} · by {res.author_name}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-[#D8B4FE] shrink-0" />
                      ) : (
                        <span className="text-[10px] text-white/40 shrink-0">Select</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedResource && (
                <div className="p-3 rounded-xl bg-white/5 border border-purple-500/30 text-xs text-white/80 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D8B4FE] shrink-0" />
                  <span>
                    Selected: <strong>{selectedResource.title}</strong> ({selectedResource.course_code})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SHARE EXTERNAL LINK */}
          {offerType === 'external_link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Resource Title <span className="text-[#D8B4FE]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. Official KL University Course Drive / GitHub Repo"
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Resource URL (http:// or https://) <span className="text-[#D8B4FE]">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition font-mono"
                />
                <p className="text-[10px] text-white/50 mt-1">
                  For safety, only secure HTTP/HTTPS educational links are permitted. Script and javascript: URLs are rejected.
                </p>
              </div>
            </div>
          )}

          {/* Note to Requester (Common to all 3 options) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Personal Message / Instructions for Requester (Optional)
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Here is the verified solution for Experiment 7 that got accepted in review..."
              className="w-full bg-[#0B0F19] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-lg shadow-indigo-500/30 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting Offer...' : 'Submit Resource Offer ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
