'use client';

import React from 'react';
import Link from 'next/link';
import { X, Download, FileText, Code2, BookOpen, Presentation, Archive, Sparkles, ExternalLink } from 'lucide-react';
import { Resource } from '@/types';
import { formatBytes, triggerBrowserDownload, dataUrlToBlob, triggerBlobDownload, r2DeliveryUrl } from '@/lib/utils';
import { getUploadedFile } from '@/lib/storage/file-storage';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';

interface ResourcePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
}

export default function ResourcePreviewModal({
  isOpen,
  onClose,
  resource,
}: ResourcePreviewModalProps) {
  const { showToast } = useApp();

  if (!isOpen) return null;

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

    const targetUrl = resource.file_url || resource.file_data_url;
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

  const isCode = ['java', 'py', 'c', 'cpp', 'v', 'txt'].includes(resource.file_type);
  const inlineDocumentSource = r2DeliveryUrl(resource.file_data_url || resource.file_url || '', 'inline');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#111115] text-white shadow-2xl sm:rounded-[1.75rem]">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-[#D8B4FE]">
              {isCode ? <Code2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-[#D8B4FE]">
                  {resource.category}
                </span>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
                  {resource.course_code}
                </span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-xs text-white/50">{formatBytes(resource.file_size)}</span>
              </div>
              <h3 className="mt-1 truncate text-sm font-bold text-white sm:text-base">
                {resource.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Close Preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Document Previewer */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#0B0F19]/90 p-3 font-sans sm:p-5">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-white/70">File: </span>
              <span className="font-mono text-[#38BDF8]">{resource.file_name}</span>
            </div>
            <div>
              <span className="font-bold text-white/70">Course: </span>
              <span className="text-white/80">{resource.course_name}</span>
            </div>
          </div>

          {resource.file_type === 'pdf' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                <span className="text-purple-200/90 font-mono">PDF Document View</span>
                <Link
                  href={`/pdf-studio?doc=${encodeURIComponent(resource.file_name)}`}
                  onClick={onClose}
                  className="px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 transition"
                >
                  <Sparkles className="h-3 w-3 text-[#38BDF8]" />
                  Open in PDF Studio
                </Link>
              </div>
              <iframe
                src={inlineDocumentSource}
                className="h-[55vh] min-h-[360px] w-full rounded-xl border border-white/10 bg-white"
                title={resource.file_name}
              />
            </div>
          ) : ['docx', 'doc'].includes(resource.file_type) ? (
            <div className="text-center py-10 space-y-3 rounded-2xl bg-gradient-to-b from-blue-950/40 to-black/30 border border-blue-500/20 p-6">
              <FileText className="h-12 w-12 text-blue-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">{resource.file_name}</h4>
              <p className="text-xs text-white/60 max-w-sm mx-auto">
                Microsoft Word Document ({formatBytes(resource.file_size)}). Download or open in PDF Studio.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  href={`/pdf-studio?doc=${encodeURIComponent(resource.file_name)}`}
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" />
                  View in Studio
                </Link>
              </div>
            </div>
          ) : ['pptx', 'ppt'].includes(resource.file_type) ? (
            <div className="text-center py-10 space-y-3 rounded-2xl bg-amber-950/20 border border-amber-500/20 p-6">
              <Presentation className="h-12 w-12 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">{resource.file_name}</h4>
              <p className="text-xs text-white/60">PowerPoint Presentation ({formatBytes(resource.file_size)})</p>
            </div>
          ) : resource.file_type === 'zip' ? (
            <div className="text-center py-10 space-y-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 p-6">
              <Archive className="h-12 w-12 text-purple-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">{resource.file_name}</h4>
              <p className="text-xs text-white/60">Compressed Archive ({formatBytes(resource.file_size)})</p>
            </div>
          ) : resource.file_content_preview ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
              <pre className="font-mono text-xs text-white/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {resource.file_content_preview}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <BookOpen className="h-10 w-10 text-white/30 mx-auto" />
              <p className="text-sm font-bold text-white">
                Academic Document Ready
              </p>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                File format: {resource.file_type.toUpperCase()} ({formatBytes(resource.file_size)}). Click download below.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-[#111115] p-3 sm:p-4">
          <p className="mr-auto hidden text-[10px] font-medium text-white/40 sm:block">
            For academic study & reference only. Respect KLU honor code.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-violet-400"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
