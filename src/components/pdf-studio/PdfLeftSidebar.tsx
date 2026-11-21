'use client';

import React, { useState } from 'react';
import {
  FileText,
  Type,
  Highlighter,
  PenTool,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Stamp,
  CheckSquare,
  Scissors,
  Combine,
  RotateCw,
  Plus,
  Trash2,
  Download,
  Image as ImageIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Layers,
} from 'lucide-react';
import { ActiveStudioTool, PageMeta, WatermarkSettings, SidebarTab } from './types';

interface PdfLeftSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  activeTool: ActiveStudioTool;
  onToolChange: (tool: ActiveStudioTool) => void;
  pagesMeta: PageMeta[];
  currentPage: number;
  onPageSelect: (pageIndex: number) => void;
  onAddBlankPage: () => void;
  onDuplicatePage?: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onRotatePage: (pageIndex: number, degrees: 90 | 180 | 270) => void;
  onRotateAllPages: (degrees: 90 | 180 | 270) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onMergeFiles: () => void;
  onSplitPages: (pageRange: string) => void;
  watermarkSettings: WatermarkSettings;
  onUpdateWatermark: (settings: Partial<WatermarkSettings>) => void;
  onExportImages: () => void;
  onExportText: () => void;
  onOpenSignatureModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function PdfLeftSidebar({
  activeTab,
  onTabChange,
  activeTool,
  onToolChange,
  pagesMeta,
  currentPage,
  onPageSelect,
  onAddBlankPage,
  onDuplicatePage,
  onDeletePage,
  onRotatePage,
  onRotateAllPages,
  onMovePage,
  onMergeFiles,
  onSplitPages,
  watermarkSettings,
  onUpdateWatermark,
  onExportImages,
  onExportText,
  onOpenSignatureModal,
  isCollapsed,
  onToggleCollapse,
}: PdfLeftSidebarProps) {
  const [splitRange, setSplitRange] = useState('1-2');

  const tabs = [
    { id: 'pages', label: 'Pages', icon: <Layers className="h-4 w-4" /> },
    { id: 'edit', label: 'Edit Text', icon: <Type className="h-4 w-4" /> },
    { id: 'annotate', label: 'Annotate', icon: <Highlighter className="h-4 w-4" /> },
    { id: 'organize', label: 'Organize', icon: <Combine className="h-4 w-4" /> },
    { id: 'forms', label: 'Sign & Form', icon: <PenTool className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <EyeOff className="h-4 w-4" /> },
    { id: 'convert', label: 'Convert', icon: <Download className="h-4 w-4" /> },
  ] as const;

  return (
    <aside className="relative flex bg-[#0B0F19] border-r border-white/10 text-white z-20 shrink-0">
      {/* Mini Icon Strip (Always visible) */}
      <div className="flex flex-col items-center py-3 px-2 border-r border-white/10 space-y-1.5 w-14 shrink-0 bg-[#0B0F19]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id && !isCollapsed;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
                if (isCollapsed) onToggleCollapse();
              }}
              className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-md shadow-indigo-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="text-[9px] font-sans tracking-tight">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}

        <div className="pt-4 mt-auto">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Panel */}
      {!isCollapsed && (
        <div className="w-64 sm:w-72 bg-[#0D1527] p-4 flex flex-col overflow-y-auto custom-scrollbar select-none">
          {/* TAB 1: PAGES & THUMBNAILS */}
          {activeTab === 'pages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Page Thumbnails ({pagesMeta.length})
                </span>
                <button
                  type="button"
                  onClick={onAddBlankPage}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-[#D8B4FE] text-[11px] font-bold flex items-center gap-1 transition border border-purple-500/30"
                  title="Add blank A4 page"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Page</span>
                </button>
              </div>

              <div className="space-y-3">
                {pagesMeta.map((page, idx) => {
                  const isCurrent = currentPage === idx + 1;
                  return (
                    <div
                      key={`${page.pageIndex}-${idx}`}
                      onClick={() => onPageSelect(idx)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                        isCurrent
                          ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/40'
                          : 'bg-[#0B0F19]/80 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">
                          Page {idx + 1}
                        </span>
                        {page.rotation > 0 && (
                          <span className="text-[10px] font-mono text-white/50">
                            {page.rotation}°
                          </span>
                        )}
                      </div>

                      {/* Mini Thumbnail representation */}
                      <div className="w-full h-24 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden group/thumb">
                        <FileText className="h-8 w-8 text-white/20" />
                        <span className="absolute bottom-1 right-2 text-[10px] font-mono text-white/40">
                          {Math.round(page.width)}x{Math.round(page.height)}
                        </span>
                      </div>

                      {/* Page Actions Toolbar */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-white/60">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRotatePage(idx, 90);
                            }}
                            className="p-1 hover:text-white rounded hover:bg-white/10"
                            title="Rotate 90° clockwise"
                          >
                            <RotateCw className="h-3 w-3" />
                          </button>
                          {onDuplicatePage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicatePage(idx);
                              }}
                              className="p-1 hover:text-white rounded hover:bg-white/10"
                              title="Duplicate page"
                            >
                              <Layers className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx > 0) onMovePage(idx, idx - 1);
                            }}
                            disabled={idx === 0}
                            className="p-1 hover:text-white rounded hover:bg-white/10 disabled:opacity-30"
                            title="Move page up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx < pagesMeta.length - 1) onMovePage(idx, idx + 1);
                            }}
                            disabled={idx === pagesMeta.length - 1}
                            className="p-1 hover:text-white rounded hover:bg-white/10 disabled:opacity-30"
                            title="Move page down"
                          >
                            ↓
                          </button>
                        </div>

                        {pagesMeta.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePage(idx);
                            }}
                            className="p-1 hover:text-rose-400 rounded hover:bg-rose-500/10"
                            title="Delete this page"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EDIT TEXT */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-white block pb-2 border-b border-white/10">
                PDF Content Editing
              </span>

              <div className="space-y-2">
                {/* Add Text Box */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'text' ? 'select' : 'text')}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    activeTool === 'text'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-md border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-purple-500/40'
                  }`}
                >
                  <Type className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Add New Text Box</span>
                    <span className="text-[10px] opacity-70 block">Click anywhere on document to place text</span>
                  </div>
                </button>

                {/* Text Replace & Redact (Real Overlay Masking) */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'text-replace' ? 'select' : 'text-replace')}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    activeTool === 'text-replace'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-md border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-purple-500/40'
                  }`}
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-[#D8B4FE] group-hover:text-current" />
                  <div>
                    <span className="text-xs font-bold block">Mask &amp; Replace Text</span>
                    <span className="text-[10px] opacity-70 block">Cleanly whiteout old text and type replacement</span>
                  </div>
                </button>

                {/* Insert Image */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'image' ? 'select' : 'image')}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    activeTool === 'image'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-md border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-purple-500/40'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Insert Image / Diagram</span>
                    <span className="text-[10px] opacity-70 block">Embed PNG/JPG diagrams onto any page</span>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 leading-relaxed">
                💡 <strong>True Text Editing Tip:</strong> Select existing printed text or drag over regions to replace grades, dates, or student codes cleanly without font corruption.
              </div>
            </div>
          )}

          {/* TAB 3: ANNOTATE */}
          {activeTab === 'annotate' && (
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-white block pb-2 border-b border-white/10">
                Markup &amp; Annotations
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Highlight */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'highlight' ? 'select' : 'highlight')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    activeTool === 'highlight'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <Highlighter className="h-4 w-4" />
                  <span className="text-xs font-bold">Highlighter</span>
                </button>

                {/* Freehand Draw */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'draw' ? 'select' : 'draw')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    activeTool === 'draw'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  <span className="text-xs font-bold">Pen / Ink</span>
                </button>

                {/* Rectangle */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'rectangle' ? 'select' : 'rectangle')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    activeTool === 'rectangle'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <Square className="h-4 w-4" />
                  <span className="text-xs font-bold">Rectangle</span>
                </button>

                {/* Circle */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'circle' ? 'select' : 'circle')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    activeTool === 'circle'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <Circle className="h-4 w-4" />
                  <span className="text-xs font-bold">Ellipse</span>
                </button>

                {/* Line */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'line' ? 'select' : 'line')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    activeTool === 'line'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  <span className="text-xs font-bold">Line</span>
                </button>

                {/* Arrow */}
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'arrow' ? 'select' : 'arrow')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    activeTool === 'arrow'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs font-bold">Arrow</span>
                </button>
              </div>

              {/* Stamps */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-white/60 block mb-2">Academic Stamps:</span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onToolChange(activeTool === 'stamp' ? 'select' : 'stamp')}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                      activeTool === 'stamp'
                        ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white border-purple-500'
                        : 'bg-[#0B0F19] border-white/10 text-white hover:border-purple-500/40'
                    }`}
                  >
                    <Stamp className="h-4 w-4" />
                    <span>Stamp Verification Seal</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORGANIZE */}
          {activeTab === 'organize' && (
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-white block pb-2 border-b border-white/10">
                Document Organization
              </span>

              {/* Merge */}
              <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Combine className="h-4 w-4 text-[#D8B4FE]" />
                  <span>Merge PDFs</span>
                </span>
                <p className="text-[10px] text-white/60">
                  Combine additional PDF notes or assignment sheets into this document.
                </p>
                <button
                  type="button"
                  onClick={onMergeFiles}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
                >
                  Append PDF File...
                </button>
              </div>

              {/* Split / Extract */}
              <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-sky-400" />
                  <span>Extract / Split Pages</span>
                </span>
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => onSplitPages(splitRange)}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
                >
                  Extract Range as New PDF
                </button>
              </div>

              {/* Batch Rotate */}
              <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-amber-300" />
                  <span>Rotate All Pages</span>
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => onRotateAllPages(90)}
                    className="py-1.5 rounded-lg bg-white/10 text-[11px] font-bold text-white hover:bg-white/20"
                  >
                    90° CW
                  </button>
                  <button
                    type="button"
                    onClick={() => onRotateAllPages(180)}
                    className="py-1.5 rounded-lg bg-white/10 text-[11px] font-bold text-white hover:bg-white/20"
                  >
                    180°
                  </button>
                  <button
                    type="button"
                    onClick={() => onRotateAllPages(270)}
                    className="py-1.5 rounded-lg bg-white/10 text-[11px] font-bold text-white hover:bg-white/20"
                  >
                    270°
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FORMS & SIGN */}
          {activeTab === 'forms' && (
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-white block pb-2 border-b border-white/10">
                Signatures &amp; Form Fields
              </span>

              {/* Digital Signature */}
              <button
                type="button"
                onClick={onOpenSignatureModal}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 hover:border-purple-400 text-left transition space-y-1 shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#D8B4FE] flex items-center gap-1.5">
                    <PenTool className="h-4 w-4" />
                    <span>Add Verified Signature</span>
                  </span>
                  <span className="text-[10px] bg-purple-500/20 text-[#D8B4FE] px-2 py-0.5 rounded-full font-mono font-bold">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-white/70">
                  Draw, type cursive calligraphy, or upload your academic endorsement.
                </p>
              </button>

              {/* Form Checkboxes */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-white/60 block">Form Field Elements:</span>
                <button
                  type="button"
                  onClick={() => onToolChange(activeTool === 'checkbox' ? 'select' : 'checkbox')}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                    activeTool === 'checkbox'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white border-purple-500'
                      : 'bg-[#0B0F19] border-white/10 text-white hover:border-purple-500/40'
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Interactive Checkmark / Checkbox</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & WATERMARK */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-white block pb-2 border-b border-white/10">
                Document Protection &amp; Watermarks
              </span>

              {/* Watermark Controls */}
              <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Student ID Watermark</span>
                  <input
                    type="checkbox"
                    checked={watermarkSettings.enabled}
                    onChange={(e) => onUpdateWatermark({ enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#D8B4FE] cursor-pointer"
                  />
                </div>

                {watermarkSettings.enabled && (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">Watermark Text:</label>
                      <input
                        type="text"
                        value={watermarkSettings.text}
                        onChange={(e) => onUpdateWatermark({ text: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60">Opacity:</span>
                      <span className="font-mono text-[#D8B4FE]">{Math.round(watermarkSettings.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={watermarkSettings.opacity}
                      onChange={(e) => onUpdateWatermark({ opacity: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Redaction / Blackout */}
              <button
                type="button"
                onClick={() => onToolChange(activeTool === 'redaction' ? 'select' : 'redaction')}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                  activeTool === 'redaction'
                    ? 'bg-rose-500 text-white font-bold shadow-md border-rose-400'
                    : 'bg-[#0B0F19] border-white/10 text-white hover:border-rose-400/40'
                }`}
              >
                <EyeOff className="h-4 w-4 shrink-0 text-rose-300" />
                <div>
                  <span className="text-xs font-bold block">Blackout / Permanent Redact</span>
                  <span className="text-[10px] opacity-70 block">Permanently black out private grades or personal info</span>
                </div>
              </button>
            </div>
          )}

          {/* TAB 7: CONVERT */}
          {activeTab === 'convert' && (
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-white block pb-2 border-b border-white/10">
                Document Conversions
              </span>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onExportImages}
                  className="w-full p-3 rounded-2xl bg-[#0B0F19] border border-white/10 hover:border-purple-500/50 text-left transition flex items-center gap-3"
                >
                  <Download className="h-4 w-4 text-[#D8B4FE]" />
                  <div>
                    <span className="text-xs font-bold block">PDF to Images (PNG)</span>
                    <span className="text-[10px] text-white/50 block">Extract pages as individual high-res PNGs</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onExportText}
                  className="w-full p-3 rounded-2xl bg-[#0B0F19] border border-white/10 hover:border-purple-500/50 text-left transition flex items-center gap-3"
                >
                  <FileText className="h-4 w-4 text-sky-400" />
                  <div>
                    <span className="text-xs font-bold block">PDF to Plain Text</span>
                    <span className="text-[10px] text-white/50 block">Extract searchable document text as .txt</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
