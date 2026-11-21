'use client';

import React from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface PdfSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export default function PdfSearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  currentMatchIndex,
  totalMatches,
  onNextMatch,
  onPrevMatch,
}: PdfSearchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-8 z-40 bg-[#131B2E] border border-white/20 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 animate-fadeIn text-white">
      <Search className="h-4 w-4 text-[#D8B4FE] ml-1 shrink-0" />
      <input
        type="text"
        autoFocus
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search text in document..."
        className="w-48 sm:w-64 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
      />

      {searchQuery && (
        <span className="text-[11px] font-mono text-white/60 whitespace-nowrap px-1">
          {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : '0 results'}
        </span>
      )}

      <div className="flex items-center gap-1 border-l border-white/10 pl-1.5">
        <button
          type="button"
          onClick={onPrevMatch}
          disabled={totalMatches === 0}
          className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onNextMatch}
          disabled={totalMatches === 0}
          className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Next match (Enter)"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 ml-0.5"
          title="Close search (Esc)"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
