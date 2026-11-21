'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Save,
  Undo2,
  Redo2,
  Download,
  Printer,
  Search,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  X,
  Sparkles,
  Layers,
  LayoutTemplate,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { SaveStatus } from './types';

interface PdfHeaderProps {
  documentName: string;
  onDocumentNameChange: (newName: string) => void;
  saveStatus: SaveStatus;
  unsavedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  viewMode: 'continuous' | 'single';
  onToggleViewMode: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSearch: () => void;
  onOpenFile: () => void;
  onExport: () => void;
  onPrint: () => void;
  onCloseDocument: () => void;
  isExporting?: boolean;
}

export default function PdfHeader({
  documentName,
  onDocumentNameChange,
  saveStatus,
  unsavedCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  onZoomChange,
  viewMode,
  onToggleViewMode,
  isFullscreen,
  onToggleFullscreen,
  onOpenSearch,
  onOpenFile,
  onExport,
  onPrint,
  onCloseDocument,
  isExporting = false,
}: PdfHeaderProps) {
  return (
    <header className="w-full bg-[#0B0F19] border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 text-white z-30 select-none">
      {/* Left: Branding & Document Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="flex items-center">
            <span className="font-black text-xl tracking-tight text-white font-sans">VSS</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              PRO STUDIO
            </span>
          </div>
        </Link>

        <span className="h-4 w-px bg-white/20 hidden sm:block shrink-0" />

        {/* Editable Document Title */}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-[#38BDF8] shrink-0" />
          <input
            type="text"
            value={documentName}
            onChange={(e) => onDocumentNameChange(e.target.value)}
            className="bg-transparent hover:bg-white/5 focus:bg-[#131B2E] focus:ring-1 focus:ring-purple-500 rounded-lg px-2 py-0.5 text-xs font-bold text-white truncate max-w-[160px] sm:max-w-xs transition outline-none"
            title="Click to rename document"
          />
        </div>

        {/* Save Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium shrink-0">
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 text-[#38BDF8]/90">
              <CheckCircle2 className="h-3 w-3" />
              <span>Saved</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 text-sky-300 animate-pulse">
              <Clock className="h-3 w-3" />
              <span>Saving changes...</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{unsavedCount} unsaved change{unsavedCount > 1 ? 's' : ''}</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              <span>Save failed</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle: Undo/Redo, Page Navigation & Zoom Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Page Nav */}
        <div className="flex items-center bg-white/5 rounded-xl border border-white/10 px-1 py-0.5 text-xs">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 text-white/70 hover:text-white disabled:opacity-30"
            title="Previous page (Left arrow)"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1 px-1 font-mono text-[11px]">
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  onPageChange(val);
                }
              }}
              className="w-7 text-center bg-transparent border-b border-white/20 focus:border-purple-500 outline-none"
            />
            <span className="text-white/40">/</span>
            <span className="text-white/70">{totalPages || 1}</span>
          </div>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 text-white/70 hover:text-white disabled:opacity-30"
            title="Next page (Right arrow)"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-white/5 rounded-xl border border-white/10 px-1 py-0.5">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.15))}
            className="p-1 text-white/70 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <select
            value={Math.round(zoom * 100)}
            onChange={(e) => onZoomChange(parseInt(e.target.value, 10) / 100)}
            className="bg-transparent text-[11px] font-mono text-white/80 focus:outline-none cursor-pointer px-1 py-0.5"
          >
            <option value="50" className="bg-[#0B0F19]">50%</option>
            <option value="75" className="bg-[#0B0F19]">75%</option>
            <option value="100" className="bg-[#0B0F19]">100%</option>
            <option value="125" className="bg-[#0B0F19]">125%</option>
            <option value="150" className="bg-[#0B0F19]">150%</option>
            <option value="200" className="bg-[#0B0F19]">200%</option>
          </select>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
            className="p-1 text-white/70 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <button
          type="button"
          onClick={onToggleViewMode}
          className="hidden lg:flex p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition"
          title={viewMode === 'continuous' ? 'Switch to single-page view' : 'Switch to continuous scroll'}
        >
          {viewMode === 'continuous' ? <Layers className="h-3.5 w-3.5" /> : <LayoutTemplate className="h-3.5 w-3.5" />}
        </button>

        {/* In-Document Search */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition"
          title="Search text in document (Ctrl+F)"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: Actions (Open, Export, Print, Fullscreen, Close) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenFile}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/15"
          title="Open another PDF from computer (Ctrl+O)"
        >
          <FolderOpen className="h-3.5 w-3.5 text-[#38BDF8]" />
          <span>Open</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="hidden sm:flex p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition"
          title="Print document (Ctrl+P)"
        >
          <Printer className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="hidden sm:flex p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>

        {/* Primary Action: Download / Export PDF */}
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          title="Export and download modified PDF (Ctrl+S)"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </button>

        <button
          type="button"
          onClick={onCloseDocument}
          className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition"
          title="Close workspace"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
