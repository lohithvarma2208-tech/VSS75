'use client';

import React from 'react';
import { X, Download, FileText, Code2, BookOpen } from 'lucide-react';
import { Resource } from '@/types';
import { formatBytes, triggerBrowserDownload } from '@/lib/utils';
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

  const handleDownload = () => {
    MockStorageManager.incrementDownload(resource.id);
    const content =
      resource.file_content_preview ||
      `// Virtual Student Space Academic Resource\n// Title: ${resource.title}\n// Course: ${resource.course_code} - ${resource.course_name}\n\n[Full Resource Content: Downloaded from Virtual Student Space]`;
    triggerBrowserDownload(resource.file_name, content);
    showToast(`Downloaded ${resource.file_name}`, 'success');
  };

  const isCode = ['java', 'py', 'c', 'cpp', 'v'].includes(resource.file_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-[2.5rem] bg-[#0D1527] shadow-2xl border border-white/15 overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30">
              {isCode ? <Code2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-[#D8B4FE]">
                  {resource.category}
                </span>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">
                  {resource.course_code}
                </span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-xs text-white/50">{formatBytes(resource.file_size)}</span>
              </div>
              <h3 className="font-bold text-base text-white line-clamp-1 mt-1">
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
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B0F19]/90 font-sans space-y-4">
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

          {resource.file_content_preview ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
              <pre className="font-mono text-xs text-white/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {resource.file_content_preview}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <BookOpen className="h-10 w-10 text-white/30 mx-auto" />
              <p className="text-sm font-bold text-white">
                Binary or Office Document Preview
              </p>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                This document ({resource.file_type.toUpperCase()}) can be downloaded directly to study with your local viewer.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 bg-[#0D1527] border-t border-white/10">
          <p className="text-[11px] text-white/50 font-medium">
            For academic study & reference only. Respect KLU honor code.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-lg shadow-indigo-500/30 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download ({formatBytes(resource.file_size)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
