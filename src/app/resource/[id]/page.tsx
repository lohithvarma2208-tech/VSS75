'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Download,
  Heart,
  Bookmark,
  Share2,
  ShieldAlert,
  ArrowLeft,
  Check,
  AlertCircle,
  Presentation,
  Archive,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { Badge } from '@/components/ui/Badge';
import { formatBytes, formatDate, triggerBrowserDownload, dataUrlToBlob, triggerBlobDownload, r2DeliveryUrl } from '@/lib/utils';
import { getUploadedFile } from '@/lib/storage/file-storage';
import { useApp } from '@/lib/context/AppContext';
import ReportModal from '@/components/resources/ReportModal';
import CommentsSection from '@/components/resources/CommentsSection';
import ResourceCard from '@/components/resources/ResourceCard';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { currentUser, likedIds, toggleLike, savedIds, toggleBookmark, showToast } = useApp();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState<boolean>(!MockStorageManager.getResourceById(id));
  const [relatedResources, setRelatedResources] = useState<Resource[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (id) {
      getUploadedFile(id).then((val) => {
        if (!active || !val) return;
        if (val instanceof Blob) {
          setPreviewSrc(URL.createObjectURL(val));
        } else if (typeof val === 'string' && val.startsWith('data:')) {
          setPreviewSrc(URL.createObjectURL(dataUrlToBlob(val)));
        }
      });
      getUploadedFile(`${id}_data_url`).then((val) => {
        if (!active || !val) return;
        if (typeof val === 'string' && val.startsWith('data:')) {
          setPreviewSrc(URL.createObjectURL(dataUrlToBlob(val)));
        }
      });
    }
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const found = MockStorageManager.getResourceById(id);
    if (found) {
      setResource(found);
      setLoading(false);
      getUploadedFile(found.file_name).then((val) => {
        if (!active || !val) return;
        if (val instanceof Blob) setPreviewSrc(URL.createObjectURL(val));
        else if (typeof val === 'string' && val.startsWith('data:')) setPreviewSrc(URL.createObjectURL(dataUrlToBlob(val)));
      });
      const all = MockStorageManager.getResources();
      const related = all
        .filter(
          (r) =>
            r.id !== found.id &&
            (r.course_code === found.course_code || r.category === found.category)
        )
        .slice(0, 3);
      setRelatedResources(related);
    } else {
      setLoading(true);
      fetch(`/api/resources?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active) return;
          if (data?.resource) {
            MockStorageManager.mergeSharedResources([data.resource]);
            setResource(data.resource);
            const all = MockStorageManager.getResources();
            const related = all
              .filter(
                (r) =>
                  r.id !== data.resource.id &&
                  (r.course_code === data.resource.course_code || r.category === data.resource.category)
              )
              .slice(0, 3);
            setRelatedResources(related);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [id]);

  if (loading && !resource) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent mx-auto mb-4" />
        <p className="text-xs text-white/50">Fetching academic document from repository…</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-white/30 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Academic Resource Not Found</h2>
        <p className="text-xs text-white/50 mt-1 mb-6">
          The resource you requested may have been archived, moved, or deleted.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-bold shadow-md shadow-indigo-500/25"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const isLiked = likedIds.includes(resource.id);
  const isSaved = savedIds.includes(resource.id);
  const documentSource = previewSrc || resource.file_data_url || resource.file_url || '';
  const inlineDocumentSource = r2DeliveryUrl(documentSource, 'inline');

  const handleDownload = async () => {
    MockStorageManager.incrementDownload(resource.id);

    // 1. Check IndexedDB/Memory store for authentic uploaded file
    const stored = (await getUploadedFile(resource.id)) || (await getUploadedFile(resource.file_name));
    if (stored) {
      if (stored instanceof Blob) {
        triggerBlobDownload(stored, resource.file_name);
        showToast(`Downloaded ${resource.file_name}`, 'success');
        return;
      } else if (typeof stored === 'string' && stored.startsWith('data:')) {
        triggerBlobDownload(dataUrlToBlob(stored), resource.file_name);
        showToast(`Downloaded ${resource.file_name}`, 'success');
        return;
      }
    }

    // 2. Check stored data URL
    const storedDataUrl = (await getUploadedFile(`${resource.id}_data_url`)) || (await getUploadedFile(`${resource.file_name}_data_url`));
    if (typeof storedDataUrl === 'string' && storedDataUrl.startsWith('data:')) {
      triggerBlobDownload(dataUrlToBlob(storedDataUrl), resource.file_name);
      showToast(`Downloaded ${resource.file_name}`, 'success');
      return;
    }

    // 3. Direct remote fetch or data URL
    const targetUrl = resource.file_url || resource.file_data_url || previewSrc || undefined;
    const ok = await triggerBrowserDownload(
      resource.file_name,
      targetUrl,
      undefined,
      resource.file_content_preview,
      {
        id: resource.id,
        title: resource.title,
        course: `${resource.course_code} - ${resource.course_name}`,
        description: resource.description,
      }
    );
    if (ok) {
      showToast(`Downloaded ${resource.file_name}`, 'success');
    } else {
      showToast('Original PDF unavailable. Please try again later.', 'error');
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      showToast('Link copied to clipboard', 'info');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window !== 'undefined' && resource) {
      const text = `📚 *${resource.title}* (${resource.course_code})\nVerified Study Resource on Virtual Student Space:\n${window.location.href}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-[#D8B4FE] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Resources</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{resource.category}</Badge>
              <span className="font-mono text-xs font-bold text-[#38BDF8] bg-[#131B2E] border border-white/10 px-2.5 py-0.5 rounded-lg">
                {resource.course_code}
              </span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/70 font-medium">{resource.semester}</span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/70 font-medium">{resource.academic_year}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {resource.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-white/60 pt-1 font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                By{' '}
                <strong className="text-white font-mono">
                  {resource.is_anonymous ? 'Anonymous' : (resource.author_name ? (resource.author_name.startsWith('@') ? resource.author_name : `@${resource.author_name}`) : (resource.author_username ? `@${resource.author_username}` : 'Anonymous'))}
                </strong>
                {!resource.is_anonymous && (resource.author_is_verified || (resource.author_id === currentUser?.id && currentUser?.is_verified_student)) && (
                  <VerifiedBadge size="xs" />
                )}
              </span>
              <span>•</span>
              <span>Shared on {formatDate(resource.created_at)}</span>
              <span>•</span>
              <span>{resource.downloads_count} downloads</span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-3">
            <h2 className="text-xs font-bold text-[#D8B4FE] uppercase tracking-wider font-mono">
              Student Notes & Submission Details
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-line font-medium">
              {resource.description}
            </p>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/10">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-purple-500/15 text-[#D8B4FE] border border-purple-500/25 px-2.5 py-0.5 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Document Preview Box */}
          <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#0B0F19] border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#38BDF8]" />
                <span className="text-xs font-bold text-white">
                  Document Preview ({resource.file_name})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/80 uppercase">
                  {resource.file_type}
                </span>
              </div>
              <span className="text-xs text-white/50 font-mono">{formatBytes(resource.file_size)}</span>
            </div>

            {resource.file_type === 'pdf' ? (
              <div className="relative">
                <div className="p-3 bg-[#080C14] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-purple-200/90 font-mono font-bold">
                      Interactive PDF Canvas &bull; {resource.file_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={inlineDocumentSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <ExternalLink className="h-3 w-3" /> Full View
                    </a>
                    <Link
                      href={`/pdf-studio?doc=${encodeURIComponent(resource.file_name)}`}
                      className="px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/30 flex items-center gap-1.5 transition"
                    >
                      <Sparkles className="h-3 w-3 text-[#38BDF8]" />
                      Annotate in PDF Studio
                    </Link>
                  </div>
                </div>
                <iframe
                  src={inlineDocumentSource}
                  className="h-[62vh] min-h-[420px] w-full border-none bg-white"
                  title={resource.file_name}
                />
              </div>
            ) : ['docx', 'doc'].includes(resource.file_type) ? (
              <div className="p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-[#0B1528] to-[#070A11]">
                <div className="inline-flex p-4 rounded-3xl bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.25)]">
                  <FileText className="h-10 w-10 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{resource.file_name}</h4>
                  <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
                    Microsoft Word Document &bull; {formatBytes(resource.file_size)} &bull; Verified Academic Material
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Original Word Document
                  </button>
                  <Link
                    href={`/pdf-studio?doc=${encodeURIComponent(resource.file_name)}`}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center gap-2 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" />
                    Inspect in PDF Studio
                  </Link>
                </div>
              </div>
            ) : ['pptx', 'ppt'].includes(resource.file_type) ? (
              <div className="p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-[#181109] to-[#070A11]">
                <div className="inline-flex p-4 rounded-3xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                  <Presentation className="h-10 w-10 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{resource.file_name}</h4>
                  <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
                    PowerPoint Presentation Slide Deck &bull; {formatBytes(resource.file_size)}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Presentation (.pptx)
                </button>
              </div>
            ) : resource.file_type === 'zip' ? (
              <div className="p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-[#141226] to-[#070A11]">
                <div className="inline-flex p-4 rounded-3xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
                  <Archive className="h-10 w-10 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{resource.file_name}</h4>
                  <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
                    Compressed Academic Archive (.zip) &bull; {formatBytes(resource.file_size)}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download ZIP Archive
                </button>
              </div>
            ) : (
              <div className="p-5 max-h-96 overflow-y-auto bg-[#070A11] text-purple-200/90 font-mono text-xs leading-relaxed">
                <pre className="whitespace-pre-wrap">
                  {resource.file_content_preview ||
                    `// File: ${resource.file_name}\n// Format: ${resource.file_type.toUpperCase()}\n// Size: ${formatBytes(resource.file_size)}\n\n[Voluntarily published academic material on Virtual Student Space]\nClick "Download File" to access the full uncompressed resource.`}
                </pre>
              </div>
            )}
          </div>

          {/* Discussion Thread */}
          <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 backdrop-blur-xl p-6 sm:p-7 shadow-xl">
            <CommentsSection resourceId={resource.id} />
          </div>
        </div>

        {/* Sidebar Actions & Info */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 backdrop-blur-xl p-6 shadow-xl space-y-4">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Download File ({formatBytes(resource.file_size)})</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => toggleLike(resource.id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition ${
                  isLiked
                    ? 'border-rose-400/40 bg-rose-500/20 text-rose-300'
                    : 'border-white/10 bg-[#0B0F19] hover:bg-[#1A243B] text-white/80'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-400' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Like'} ({resource.likes_count})</span>
              </button>

              <button
                onClick={() => toggleBookmark(resource.id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition ${
                  isSaved
                    ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                    : 'border-white/10 bg-[#0B0F19] hover:bg-[#1A243B] text-white/80'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-[#0B0F19] text-xs font-bold text-white/80 hover:bg-[#1A243B] hover:text-white transition"
            >
              {isCopied ? <Check className="h-4 w-4 text-[#38BDF8]" /> : <Share2 className="h-4 w-4" />}
              <span>{isCopied ? 'Link Copied!' : 'Share Resource Link'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition active:scale-95"
            >
              <span>💬 Share to Class WhatsApp</span>
            </button>

            <div className="border-t border-white/10 pt-3">
              <button
                onClick={() => setIsReportOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-rose-400 transition font-medium"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Report Academic Issue or Violation</span>
              </button>
            </div>
          </div>

          {/* Academic Metadata Card */}
          <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 backdrop-blur-xl p-5 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-[#D8B4FE] uppercase tracking-wider text-[11px] font-mono">
              Course Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/60 font-medium">Course Code</span>
                <span className="font-bold font-mono text-[#38BDF8]">{resource.course_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/60 font-medium">Course Name</span>
                <span className="font-semibold text-white text-right">{resource.course_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/60 font-medium">Semester</span>
                <span className="font-semibold text-white">{resource.semester}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/60 font-medium">Resource Type</span>
                <span className="font-semibold text-white">{resource.resource_type}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/60 font-medium">File Type</span>
                <span className="font-mono uppercase font-bold text-white">
                  {resource.file_type}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Reference Disclaimer */}
          <div className="rounded-3xl border border-purple-500/20 bg-purple-950/30 p-4 text-xs text-purple-200 space-y-1.5 shadow-subtle">
            <p className="font-bold flex items-center gap-1.5 text-[#D8B4FE]">
              <span>Peer Reference Notice</span>
            </p>
            <p className="text-[11px] leading-relaxed text-purple-200/80 font-medium">
              This document is voluntarily shared by a peer for study analysis and conceptual clarity in Virtual Student Space.
              Do not submit someone else's work for grading.
            </p>
          </div>
        </div>
      </div>

      {/* Related Resources */}
      {relatedResources.length > 0 && (
        <div className="pt-8 border-t border-white/10 space-y-6">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Related Academic Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedResources.map((rel) => (
              <ResourceCard key={rel.id} resource={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        resource={resource}
      />
    </div>
  );
}
