'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Heart,
  Bookmark,
  Eye,
  Code2,
  FileCheck,
  Check,
  Share2,
} from 'lucide-react';
import { Resource } from '@/types';
import { formatBytes, formatDate, triggerBrowserDownload, dataUrlToBlob, triggerBlobDownload } from '@/lib/utils';
import { getUploadedFile } from '@/lib/storage/file-storage';
import { useApp } from '@/lib/context/AppContext';
import ResourcePreviewModal from './ResourcePreviewModal';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

interface ResourceCardProps {
  resource: Resource;
  layout?: 'grid' | 'list';
}

export default function ResourceCard({ resource, layout = 'grid' }: ResourceCardProps) {
  const { currentUser, likedIds, toggleLike, savedIds, toggleBookmark, showToast } = useApp();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isLiked = likedIds.includes(resource.id);
  const isSaved = savedIds.includes(resource.id);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    MockStorageManager.incrementDownload(resource.id);

    // 1. Check IndexedDB/Memory store for authentic uploaded file
    const stored = await getUploadedFile(resource.id);
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
    const storedDataUrl = await getUploadedFile(`${resource.id}_data_url`);
    if (typeof storedDataUrl === 'string' && storedDataUrl.startsWith('data:')) {
      triggerBlobDownload(dataUrlToBlob(storedDataUrl), resource.file_name);
      showToast(`Downloaded ${resource.file_name}`, 'success');
      return;
    }

    const targetUrl = resource.file_data_url || resource.file_url;
    await triggerBrowserDownload(
      resource.file_name,
      targetUrl,
      undefined,
      resource.file_content_preview,
      {
        title: resource.title,
        course: `${resource.course_code} - ${resource.course_name}`,
        description: resource.description,
      }
    );
    showToast(`Downloaded ${resource.file_name}`, 'success');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/resource/${resource.id}`;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast('Resource link copied to clipboard!', 'info');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isCode = ['java', 'py', 'c', 'cpp', 'v'].includes(resource.file_type);

  if (layout === 'list') {
    return (
      <>
        <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-3xl border border-white/10 bg-[#131B2E]/70 hover:border-purple-500/50 hover:bg-[#1A243B] transition-all duration-200 gap-4 shadow-card">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10 shrink-0 text-white">
              {isCode ? (
                <Code2 className="h-5 w-5 text-[#38BDF8]" />
              ) : resource.file_type === 'pdf' ? (
                <FileText className="h-5 w-5 text-rose-400" />
              ) : (
                <FileCheck className="h-5 w-5 text-[#C084FC]" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30">
                  {resource.category}
                </span>
                <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
                  {resource.course_code}
                </span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-xs text-white/60 font-medium">{resource.semester}</span>
              </div>
              <Link
                href={`/resource/${resource.id}`}
                className="block font-bold text-sm text-white hover:text-[#D8B4FE] transition truncate"
              >
                {resource.title}
              </Link>
              <p className="text-xs text-white/60 line-clamp-1 leading-relaxed">
                {resource.description}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-white/40 pt-0.5">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                  By {resource.is_anonymous ? 'Anonymous' : (resource.author_name ? (resource.author_name.startsWith('@') ? resource.author_name : `@${resource.author_name}`) : (resource.author_username ? `@${resource.author_username}` : 'Anonymous'))}
                  {!resource.is_anonymous && (resource.author_is_verified || (resource.author_id === currentUser?.id && currentUser?.is_verified_student)) && (
                    <VerifiedBadge size="xs" showLabel={false} />
                  )}
                </span>
                <span>•</span>
                <span suppressHydrationWarning>{formatDate(resource.created_at)}</span>
                <span>•</span>
                <span>{formatBytes(resource.file_size)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
              title="Quick Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleLike(resource.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition text-xs font-bold ${
                isLiked
                  ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30'
                  : 'text-white/60 hover:bg-white/10'
              }`}
              title="Like"
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
              <span>{resource.likes_count}</span>
            </button>
            <button
              onClick={() => toggleBookmark(resource.id)}
              className={`p-2 rounded-full transition ${
                isSaved
                  ? 'text-[#f59e0b] bg-amber-500/20 border border-amber-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[#f59e0b]' : ''}`} />
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white rounded-full text-xs font-extrabold shadow-md shadow-indigo-500/25 transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{resource.downloads_count}</span>
            </button>
          </div>
        </div>
        <ResourcePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          resource={resource}
        />
      </>
    );
  }

  // Grid view (Default)
  return (
    <>
      <div className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#131B2E]/70 p-6 hover:border-purple-500/50 hover:bg-[#1A243B] transition-all duration-200 shadow-card hover:-translate-y-1">
        <div>
          {/* Card Top Pill Bar */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30 font-mono">
                {resource.category}
              </span>
              <span className="font-mono text-[11px] font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                {resource.course_code}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleBookmark(resource.id)}
                className={`p-1.5 rounded-full transition ${
                  isSaved
                    ? 'text-[#f59e0b] bg-amber-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                title="Bookmark resource"
              >
                <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-[#f59e0b]' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"
                title="Share link"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-[#38BDF8]" /> : <Share2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <Link
            href={`/resource/${resource.id}`}
            className="block font-bold text-base text-white group-hover:text-[#D8B4FE] transition-colors leading-snug line-clamp-2 mb-2"
          >
            {resource.title}
          </Link>

          {/* Description */}
          <p className="text-xs text-white/60 leading-relaxed line-clamp-3 mb-4 font-normal">
            {resource.description}
          </p>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {resource.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-white/5 text-white/70 px-2.5 py-0.5 rounded-full border border-white/10 font-mono"
                >
                  #{tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="text-[10px] text-white/40 self-center font-mono">
                  +{resource.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-3 font-medium">
            <span className="truncate inline-flex items-center gap-1.5 font-mono text-[11px]">
              By {resource.is_anonymous ? 'Anonymous' : (resource.author_name ? (resource.author_name.startsWith('@') ? resource.author_name : `@${resource.author_name}`) : (resource.author_username ? `@${resource.author_username}` : 'Anonymous'))}
              {!resource.is_anonymous && (resource.author_is_verified || (resource.author_id === currentUser?.id && currentUser?.is_verified_student)) && (
                <VerifiedBadge size="xs" showLabel={false} />
              )}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-white/40">{formatBytes(resource.file_size)}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleLike(resource.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  isLiked
                    ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30'
                    : 'text-white/60 hover:bg-white/10'
                }`}
                title="Like"
              >
                <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
                <span>{resource.likes_count}</span>
              </button>

              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                title="Quick preview"
              >
                <Eye className="h-3.5 w-3.5 text-white/50" />
                <span>Preview</span>
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition active:scale-95"
              title={`Download ${resource.file_name}`}
            >
              <Download className="h-3 w-3" />
              <span>{resource.downloads_count}</span>
            </button>
          </div>
        </div>
      </div>

      <ResourcePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        resource={resource}
      />
    </>
  );
}
