'use client';

import React from 'react';
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Sliders,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Square,
  PenTool,
  RotateCw,
  FileText,
  Highlighter,
} from 'lucide-react';
import { AnyAnnotation, PageMeta, ActiveStudioTool } from './types';

interface PdfPropertiesPanelProps {
  selectedAnnotation: AnyAnnotation | null;
  onUpdateAnnotation: (id: string, updates: Partial<AnyAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  currentPageMeta: PageMeta | null;
  activeTool: ActiveStudioTool;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function PdfPropertiesPanel({
  selectedAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentPageMeta,
  activeTool,
  isCollapsed,
  onToggleCollapse,
}: PdfPropertiesPanelProps) {
  if (isCollapsed) {
    return (
      <div className="bg-[#0B0F19] border-l border-white/10 p-2 flex flex-col items-center">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          title="Expand Properties Panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-[#0D1527] border-l border-white/10 p-4 text-white z-20 flex flex-col justify-between overflow-y-auto custom-scrollbar select-none">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-[#D8B4FE]" />
            <span>Properties</span>
          </span>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10"
            title="Collapse panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 1. TEXT PROPERTIES (When a Text or Text-Replace annotation is selected) */}
        {selectedAnnotation && (selectedAnnotation.type === 'text' || selectedAnnotation.type === 'text-replace') && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-[#D8B4FE] block">Typography &amp; Style</span>

            {/* Font Family */}
            <div>
              <label className="text-[10px] text-white/60 block mb-1">Font Family</label>
              <select
                value={selectedAnnotation.fontFamily || 'Helvetica'}
                onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { fontFamily: e.target.value as any })}
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Helvetica" className="bg-[#0B0F19]">Helvetica / Arial</option>
                <option value="Times" className="bg-[#0B0F19]">Times New Roman</option>
                <option value="Courier" className="bg-[#0B0F19]">Courier Monospace</option>
              </select>
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Size (pt)</label>
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={selectedAnnotation.fontSize || 14}
                  onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { fontSize: parseInt(e.target.value, 10) || 14 })}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 block mb-1">Styling</label>
                <div className="flex items-center gap-1 bg-[#0B0F19] border border-white/15 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(selectedAnnotation.id, { isBold: !(selectedAnnotation as any).isBold })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      (selectedAnnotation as any).isBold ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white' : 'text-white/60 hover:text-white'
                    }`}
                    title="Bold"
                  >
                    <Bold className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(selectedAnnotation.id, { isItalic: !(selectedAnnotation as any).isItalic })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      (selectedAnnotation as any).isItalic ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white' : 'text-white/60 hover:text-white'
                    }`}
                    title="Italic"
                  >
                    <Italic className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="text-[10px] text-white/60 block mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedAnnotation.color || '#000000'}
                  onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { color: e.target.value })}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={selectedAnnotation.color || '#000000'}
                  onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { color: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Text Replace Specifics */}
            {selectedAnnotation.type === 'text-replace' && (
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Underlying Mask Color</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(selectedAnnotation.id, { maskColor: '#ffffff' })}
                    className={`py-1 rounded-lg border text-xs font-bold ${
                      selectedAnnotation.maskColor === '#ffffff'
                        ? 'bg-white text-slate-900 border-purple-500'
                        : 'bg-white/10 text-white border-white/10'
                    }`}
                  >
                    White Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(selectedAnnotation.id, { maskColor: '#000000' })}
                    className={`py-1 rounded-lg border text-xs font-bold ${
                      selectedAnnotation.maskColor === '#000000'
                        ? 'bg-black text-white border-purple-500'
                        : 'bg-black/40 text-white/80 border-white/10'
                    }`}
                  >
                    Blackout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SHAPE PROPERTIES */}
        {selectedAnnotation && selectedAnnotation.type === 'shape' && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-[#D8B4FE] block">Vector Shape Properties</span>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Stroke Width ({selectedAnnotation.strokeWidth || 2}px)</label>
              <input
                type="range"
                min="1"
                max="16"
                value={selectedAnnotation.strokeWidth || 2}
                onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { strokeWidth: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Stroke Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedAnnotation.strokeColor || '#8B5CF6'}
                  onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { strokeColor: e.target.value })}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-white/80">{selectedAnnotation.strokeColor}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Fill Color (Optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedAnnotation.fillColor || '#131B2E'}
                  onChange={(e) => onUpdateAnnotation(selectedAnnotation.id, { fillColor: e.target.value })}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <button
                  type="button"
                  onClick={() => onUpdateAnnotation(selectedAnnotation.id, { fillColor: undefined })}
                  className="text-[10px] text-white/40 hover:text-white"
                >
                  Transparent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. HIGHLIGHT PROPERTIES */}
        {selectedAnnotation && selectedAnnotation.type === 'highlight' && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[#D8B4FE] block">Highlighter Properties</span>
            <div className="grid grid-cols-4 gap-2">
              {['#fef08a', '#d8b4fe', '#a5f3fc', '#fbcfe8'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdateAnnotation(selectedAnnotation.id, { color })}
                  style={{ backgroundColor: color }}
                  className={`h-7 rounded-lg transition ${
                    selectedAnnotation.color === color ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 4. DEFAULT: PAGE INFORMATION */}
        {(!selectedAnnotation || selectedAnnotation.type === 'draw' || selectedAnnotation.type === 'signature') && currentPageMeta && (
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold text-white/70 block uppercase tracking-wider">
              Active Page Info
            </span>
            <div className="p-3 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Page Number:</span>
                <span className="font-mono font-bold text-white">Page {currentPageMeta.pageNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Dimensions:</span>
                <span className="font-mono text-white/80">{Math.round(currentPageMeta.width)} × {Math.round(currentPageMeta.height)} pt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Format:</span>
                <span className="text-white/80">{currentPageMeta.height > currentPageMeta.width ? 'Portrait (A4)' : 'Landscape'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Rotation:</span>
                <span className="font-mono text-[#38BDF8]">{currentPageMeta.rotation || 0}°</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Button for selected element */}
      {selectedAnnotation && (
        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Selected Element</span>
          </button>
        </div>
      )}
    </aside>
  );
}
