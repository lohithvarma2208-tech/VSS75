'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  Plus,
  RefreshCw,
  FolderOpen,
  Sliders,
  Scissors,
  Layers,
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { useApp } from '@/lib/context/AppContext';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { Resource } from '@/types';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import {
  ActiveStudioTool,
  SidebarTab,
  SaveStatus,
  AnyAnnotation,
  PageMeta,
  WatermarkSettings,
} from '@/components/pdf-studio/types';
import PdfHeader from '@/components/pdf-studio/PdfHeader';
import PdfLeftSidebar from '@/components/pdf-studio/PdfLeftSidebar';
import PdfPropertiesPanel from '@/components/pdf-studio/PdfPropertiesPanel';
import PdfPageCanvas from '@/components/pdf-studio/PdfPageCanvas';
import PdfSignatureModal from '@/components/pdf-studio/PdfSignatureModal';
import PdfSearchModal from '@/components/pdf-studio/PdfSearchModal';
import { exportFinalPdf } from '@/components/pdf-studio/pdf-exporter';

const REQUIRED_SUBMISSIONS = 5;

export default function PDFStudioPage() {
  const { currentUser, showToast, openVerifyModal } = useApp();
  const [resources, setResources] = useState<Resource[]>([]);

  // Gate simulation state
  const [overrideCount, setOverrideCount] = useState<number | null>(null);

  // --- WORKSPACE CORE STATE ---
  const [documentName, setDocumentName] = useState('23CS2101_Exp5_AVL_Trees_LabRecord.pdf');
  const [sourcePdfBytes, setSourcePdfBytes] = useState<Uint8Array | null>(null);
  const [pdfJsDoc, setPdfJsDoc] = useState<any>(null);
  const [pagesMeta, setPagesMeta] = useState<PageMeta[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'continuous' | 'single'>('continuous');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tool & Sidebar State
  const [activeTab, setActiveTab] = useState<SidebarTab>('pages');
  const [activeTool, setActiveTool] = useState<ActiveStudioTool>('select');
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // Annotations & Selection
  const [annotations, setAnnotations] = useState<AnyAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // History for Undo / Redo
  const [historyPast, setHistoryPast] = useState<AnyAnnotation[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<AnyAnnotation[][]>([]);

  // Save Status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [unsavedCount, setUnsavedCount] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Modals
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mergeFileInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceContainerRef = useRef<HTMLDivElement | null>(null);

  // Watermark Settings
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    enabled: false,
    text: `${currentUser?.code_name || 'SHADOW_SCHOLAR_01'} · VSS ACADEMIC COPY · PEER REFERENCE ONLY`,
    opacity: 0.25,
    color: 'emerald',
    rotation: 45,
    includeStudentHeader: true,
  });

  // Load resources & verified submissions
  useEffect(() => {
    setResources(MockStorageManager.getResources());
    const handleUpdate = () => setResources(MockStorageManager.getResources());
    window.addEventListener('klu_resources_change', handleUpdate);
    return () => window.removeEventListener('klu_resources_change', handleUpdate);
  }, []);

  // Compute verified submissions count
  const userUploads = resources.filter(
    (r) =>
      r.author_id === currentUser?.id ||
      r.author_name === currentUser?.full_name ||
      r.author_username === currentUser?.username
  );
  // Compute weekly verified submissions count (in last 7 days)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyUploads = userUploads.filter((r) => {
    if (r.status !== 'approved' || r.is_anonymous) return false;
    return new Date(r.created_at).getTime() >= oneWeekAgo;
  });
  const realCount = weeklyUploads.length;
  const verifiedCount = overrideCount !== null ? overrideCount : realCount;
  const isUnlocked = verifiedCount >= REQUIRED_SUBMISSIONS;
  const progressPercent = Math.min(100, Math.round((verifiedCount / REQUIRED_SUBMISSIONS) * 100));

  // --- INITIALIZE & LOAD PDF ---
  const loadPdfFromBytes = useCallback(async (bytes: Uint8Array, name: string) => {
    try {
      setSourcePdfBytes(bytes);
      setDocumentName(name);

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false });
      const doc = await loadingTask.promise;
      setPdfJsDoc(doc);

      const count = doc.numPages;
      const metaList: PageMeta[] = [];

      for (let i = 1; i <= count; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        metaList.push({
          pageIndex: i - 1,
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          rotation: 0,
        });
      }

      setPagesMeta(metaList);
      setCurrentPage(1);
      setAnnotations([]);
      setHistoryPast([]);
      setHistoryFuture([]);
      setSaveStatus('saved');
      setUnsavedCount(0);
      showToast(`Loaded ${name} (${count} pages)`, 'success');
    } catch (err) {
      console.error('Error loading PDF into workspace:', err);
      showToast('Could not load PDF document. Please verify file format.', 'error');
    }
  }, [showToast]);

  // Load initial sample PDF
  useEffect(() => {
    async function loadSample() {
      try {
        const res = await fetch('/samples/23CS2101_Exp5_AVL_Trees_LabRecord.pdf');
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          loadPdfFromBytes(new Uint8Array(buffer), '23CS2101_Exp5_AVL_Trees_LabRecord.pdf');
        }
      } catch (e) {
        console.warn('Could not load default sample PDF', e);
      }
    }

    if (!sourcePdfBytes) {
      loadSample();
    }
  }, [loadPdfFromBytes, sourcePdfBytes]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Export PDF
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExportPdf();
      }
      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+F: Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Ctrl+O: Open file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      // Delete / Backspace: delete selected annotation
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        // Do not intercept if user is typing in input or textarea
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          handleDeleteAnnotation(selectedAnnotationId);
        }
      }
      // Escape: Close modals / unselect
      if (e.key === 'Escape') {
        setSelectedAnnotationId(null);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, annotations]);

  // --- ANNOTATION MUTATION & HISTORY ---
  const pushHistory = (newAnnotations: AnyAnnotation[]) => {
    setHistoryPast((prev) => [...prev, annotations]);
    setHistoryFuture([]);
    setAnnotations(newAnnotations);
    setSaveStatus('unsaved');
    setUnsavedCount((c) => c + 1);
  };

  const handleAddAnnotation = (annot: AnyAnnotation) => {
    pushHistory([...annotations, annot]);
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<AnyAnnotation>) => {
    const next = annotations.map((a) => (a.id === id ? ({ ...a, ...updates } as AnyAnnotation) : a));
    pushHistory(next);
  };

  const handleDeleteAnnotation = (id: string) => {
    const next = annotations.filter((a) => a.id !== id);
    pushHistory(next);
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    showToast('Element deleted', 'info');
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setHistoryFuture((prev) => [annotations, ...prev]);
    setAnnotations(previous);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev, annotations]);
    setAnnotations(next);
  };

  // --- PAGE OPERATIONS ---
  const handleRotatePage = (pageIndex: number) => {
    setPagesMeta((prev) =>
      prev.map((p, idx) => (idx === pageIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
    setSaveStatus('unsaved');
    setUnsavedCount((c) => c + 1);
    showToast(`Page ${pageIndex + 1} rotated 90°`, 'info');
  };

  const handleRotateAllPages = (angle: 90 | 180 | 270) => {
    setPagesMeta((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + angle) % 360 })));
    setSaveStatus('unsaved');
    setUnsavedCount((c) => c + 1);
    showToast(`All pages rotated ${angle}°`, 'success');
  };

  const handleDuplicatePage = (pageIndex: number) => {
    const target = pagesMeta[pageIndex];
    if (!target) return;
    const duplicated: PageMeta = {
      ...target,
      pageNumber: pagesMeta.length + 1,
    };
    const nextMeta = [...pagesMeta.slice(0, pageIndex + 1), duplicated, ...pagesMeta.slice(pageIndex + 1)];
    setPagesMeta(nextMeta);
    setSaveStatus('unsaved');
    setUnsavedCount((c) => c + 1);
    showToast(`Page ${pageIndex + 1} duplicated`, 'success');
  };

  const handleDeletePage = (pageIndex: number) => {
    if (pagesMeta.length <= 1) {
      showToast('Cannot delete the only page in the document.', 'error');
      return;
    }
    const nextMeta = pagesMeta.filter((_, idx) => idx !== pageIndex);
    setPagesMeta(nextMeta);
    // Remove annotations on deleted page
    setAnnotations((prev) => prev.filter((a) => a.pageIndex !== pageIndex));
    setSaveStatus('unsaved');
    setUnsavedCount((c) => c + 1);
    showToast(`Page ${pageIndex + 1} removed`, 'info');
  };

  const handleAddBlankPage = () => {
    const newPage: PageMeta = {
      pageIndex: pagesMeta.length,
      pageNumber: pagesMeta.length + 1,
      width: 595.28, // A4
      height: 841.89,
      rotation: 0,
    };
    setPagesMeta((prev) => [...prev, newPage]);
    setSaveStatus('unsaved');
    setUnsavedCount((c) => c + 1);
    showToast('Added blank A4 page to document', 'success');
  };

  // --- MERGE & SPLIT ---
  const handleOpenMergeDialog = () => {
    mergeFileInputRef.current?.click();
  };

  const handleMergeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && sourcePdfBytes) {
      try {
        const file = e.target.files[0];
        const extraBuffer = await file.arrayBuffer();
        const baseDoc = await PDFDocument.load(sourcePdfBytes);
        const extraDoc = await PDFDocument.load(extraBuffer);

        const copiedPages = await baseDoc.copyPages(extraDoc, extraDoc.getPageIndices());
        copiedPages.forEach((p) => baseDoc.addPage(p));

        const mergedBytes = await baseDoc.save();
        await loadPdfFromBytes(mergedBytes, documentName);
        showToast(`Appended "${file.name}" successfully!`, 'success');
      } catch {
        showToast('Failed to merge PDF. Ensure file is a valid PDF.', 'error');
      }
    }
  };

  const handleSplitPages = async (rangeStr: string) => {
    if (!sourcePdfBytes) return;
    try {
      setIsExporting(true);
      const srcDoc = await PDFDocument.load(sourcePdfBytes);
      const splitDoc = await PDFDocument.create();
      const total = srcDoc.getPageCount();

      const pagesToExtract = new Set<number>();
      rangeStr.split(',').forEach((part) => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [s, e] = trimmed.split('-').map((v) => parseInt(v, 10));
          if (!isNaN(s) && !isNaN(e)) {
            for (let i = s; i <= e; i++) {
              if (i >= 1 && i <= total) pagesToExtract.add(i - 1);
            }
          }
        } else {
          const num = parseInt(trimmed, 10);
          if (!isNaN(num) && num >= 1 && num <= total) pagesToExtract.add(num - 1);
        }
      });

      if (pagesToExtract.size === 0) {
        showToast('Invalid page range entered.', 'error');
        setIsExporting(false);
        return;
      }

      const copied = await splitDoc.copyPages(srcDoc, Array.from(pagesToExtract));
      copied.forEach((p) => splitDoc.addPage(p));

      const splitBytes = await splitDoc.save();
      downloadBlob(splitBytes, `Extracted_Pages_${documentName}`);
      showToast(`Extracted ${pagesToExtract.size} pages into new PDF!`, 'success');
    } catch {
      showToast('Error extracting page range.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // --- EXPORT FINAL PDF ---
  const handleExportPdf = async () => {
    if (!sourcePdfBytes) {
      showToast('No PDF loaded to export.', 'error');
      return;
    }

    try {
      setIsExporting(true);
      setSaveStatus('saving');

      const finalPdfBytes = await exportFinalPdf(
        sourcePdfBytes,
        pagesMeta,
        annotations,
        watermarkSettings,
        currentUser?.code_name || currentUser?.username || 'SHADOW_SCHOLAR_01'
      );

      downloadBlob(finalPdfBytes, `Edited_${documentName}`);
      setSaveStatus('saved');
      setUnsavedCount(0);
      showToast('PDF exported and downloaded successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      setSaveStatus('error');
      showToast('Failed to export PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // --- CONVERT ACTIONS ---
  const handleExportImages = () => {
    showToast('Rendering high-res page snapshots...', 'info');
    // Finds rendered canvas elements and triggers download
    const canvases = document.querySelectorAll('canvas');
    if (canvases.length > 0) {
      const firstCanvas = canvases[0] as HTMLCanvasElement;
      const dataUrl = firstCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${documentName.replace('.pdf', '')}_Page1.png`;
      a.click();
      showToast('Exported page image snapshot (PNG)', 'success');
    }
  };

  const handleExportText = async () => {
    if (!pdfJsDoc) return;
    try {
      let fullText = `=== VSS PRO PDF STUDIO TEXT EXTRACTION ===\nDocument: ${documentName}\n\n`;
      for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += `--- PAGE ${i} ---\n${pageText}\n\n`;
      }
      const blob = new Blob([fullText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName.replace('.pdf', '')}_Extracted_Text.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Extracted document text as .txt', 'success');
    } catch {
      showToast('Failed to extract text from document.', 'error');
    }
  };

  // Helper download blob
  const downloadBlob = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Create clean blank document from scratch
  const handleCreateBlankDoc = async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595.28, 841.89]); // A4
    const bytes = await doc.save();
    loadPdfFromBytes(bytes, 'Untitled_Document.pdf');
  };

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId) || null;
  const currentPageMeta = pagesMeta[currentPage - 1] || null;

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#09090b]" />

        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 -left-20 w-[480px] h-[480px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[520px] h-[520px] bg-purple-600/25 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-xl w-full bg-[#0D1527]/80 border border-purple-500/40 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl backdrop-blur-2xl relative z-10 text-center space-y-6">
          {/* Glowing Padlock */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 rounded-3xl blur-xl opacity-75 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#0F172A] border border-purple-500/40 flex items-center justify-center shadow-2xl">
                <Lock className="h-8 w-8 text-[#D8B4FE]" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30 uppercase tracking-widest">
              Weekly Contributor Benefit · 5 Posts Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PDF Studio Pro Access Locked
            </h1>
            <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
              PDF Studio is an exclusive in-browser PDF suite reserved for active academic contributors. Post at least <strong>5 verified resources each week</strong> to unlock the complete studio for 7 days.
            </p>
          </div>

          {/* Progress Tracker Card */}
          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Your Weekly Contributions:</span>
              <span className="font-mono font-bold text-[#D8B4FE]">
                {verifiedCount} / {REQUIRED_SUBMISSIONS} Uploads ({progressPercent}%)
              </span>
            </div>

            {/* Glowing progress track */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] rounded-full transition-all duration-500 shadow-md shadow-purple-500/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-white/50 text-center font-mono pt-1">
              {REQUIRED_SUBMISSIONS - verifiedCount > 0
                ? `Upload ${REQUIRED_SUBMISSIONS - verifiedCount} more approved material(s) this week to unlock.`
                : 'Requirement met! Refreshing studio access...'}
            </p>
          </div>

          {/* Features Locked Preview */}
          <div className="grid grid-cols-2 gap-2 text-left pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#38BDF8] shrink-0" />
              <span>Multi-Page Annotate & Draw</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-[#D8B4FE] shrink-0" />
              <span>Digital Handwritten Signatures</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-[#A855F7] shrink-0" />
              <span>Merge & Split Documents</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8] shrink-0" />
              <span>Whiteout & Text Redaction</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/upload"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Work to Unlock</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs sm:text-sm transition"
            >
              Back to Home
            </Link>
          </div>

          {/* Demo Testing Simulator Controls */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-center gap-2">
            <span className="text-[10px] text-white/40 font-mono">Simulator (Testing):</span>
            <button
              type="button"
              onClick={() => {
                setOverrideCount(5);
                showToast('Simulated 5 Weekly Uploads: PDF Studio Unlocked! 🎉', 'success');
              }}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-[#D8B4FE] border border-purple-500/30 text-[10px] font-mono font-bold transition flex items-center gap-1"
            >
              <Unlock className="h-3 w-3" />
              <span>Simulate 5 Uploads (Unlock Studio)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070A11]/60 text-white backdrop-blur-[1px]">
      {/* 1. TOP PROFESSIONAL APPLICATION HEADER */}
      <PdfHeader
        documentName={documentName}
        onDocumentNameChange={setDocumentName}
        saveStatus={saveStatus}
        unsavedCount={unsavedCount}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        currentPage={currentPage}
        totalPages={pagesMeta.length}
        onPageChange={setCurrentPage}
        zoom={zoom}
        onZoomChange={setZoom}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((m) => (m === 'continuous' ? 'single' : 'continuous'))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          } else {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenFile={() => fileInputRef.current?.click()}
        onExport={handleExportPdf}
        onPrint={() => window.print()}
        onCloseDocument={() => window.history.back()}
        isExporting={isExporting}
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        className="hidden"
        onChange={async (e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const buffer = await file.arrayBuffer();
            loadPdfFromBytes(new Uint8Array(buffer), file.name);
          }
        }}
      />
      <input
        type="file"
        ref={mergeFileInputRef}
        accept=".pdf"
        className="hidden"
        onChange={handleMergeFileSelected}
      />

      {/* In-Document Text Search Bar (Ctrl+F) */}
      <PdfSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentMatchIndex={currentMatchIndex}
        totalMatches={totalMatches}
        onNextMatch={() => {}}
        onPrevMatch={() => {}}
      />

      {/* Digital Signature Modal */}
      <PdfSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={(dataUrl) => {
          const newSig: AnyAnnotation = {
            id: `sig-${Date.now()}`,
            type: 'signature',
            pageIndex: currentPage - 1,
            x: 80,
            y: 200,
            width: 170,
            height: 65,
            dataUrl,
            opacity: 1,
          };
          handleAddAnnotation(newSig);
          setSelectedAnnotationId(newSig.id);
          showToast('Signature placed onto document! Drag to position.', 'success');
        }}
        defaultName={currentUser?.code_name || currentUser?.username || 'SHADOW_SCHOLAR_01'}
      />

      {/* 2. MAIN WORKSPACE VIEWPORT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Tool & Navigation Sidebar */}
        <PdfLeftSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          isCollapsed={isLeftSidebarCollapsed}
          onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          pagesMeta={pagesMeta}
          currentPage={currentPage}
          onPageSelect={(idx) => setCurrentPage(idx + 1)}
          onRotatePage={handleRotatePage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onAddBlankPage={handleAddBlankPage}
          onMovePage={() => {}}
          onMergeFiles={handleOpenMergeDialog}
          onSplitPages={handleSplitPages}
          onRotateAllPages={handleRotateAllPages}
          onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
          watermarkSettings={watermarkSettings}
          onUpdateWatermark={(updates) => setWatermarkSettings((prev) => ({ ...prev, ...updates }))}
          onExportImages={handleExportImages}
          onExportText={handleExportText}
        />

        {/* Center: Document Canvas Viewport */}
        <main
          ref={workspaceContainerRef}
          className="flex-1 bg-[#070A11] overflow-auto p-6 sm:p-10 flex flex-col items-center custom-scrollbar relative"
        >
          {/* Quick Action Ribbon */}
          <div className="sticky top-0 z-20 mb-4 px-4 py-2 rounded-2xl bg-[#131B2E]/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-3 text-xs">
            <span className="text-white/60">Active Tool:</span>
            <span className="font-mono font-bold text-[#D8B4FE] uppercase tracking-wider">
              {activeTool}
            </span>
            <span className="text-white/20">•</span>
            <button
              onClick={() => setActiveTool('select')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTool === 'select' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              Pointer / Select
            </button>
            <button
              onClick={() => setActiveTool('text')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTool === 'text' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              + Text Box
            </button>
            <button
              onClick={() => setActiveTool('text-replace')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTool === 'text-replace' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              Mask &amp; Replace
            </button>
            <button
              onClick={() => setActiveTool('highlight')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTool === 'highlight' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              Highlight
            </button>
            <button
              onClick={() => setActiveTool('draw')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTool === 'draw' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              Draw
            </button>
            <button
              onClick={() => setIsSignatureModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold transition flex items-center gap-1"
            >
              <span>Sign</span>
            </button>
          </div>

          {/* Render PDF Pages */}
          {pagesMeta.length === 0 ? (
            <div className="text-center py-24 text-white/50 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs">Loading PDF document into studio canvas...</p>
            </div>
          ) : viewMode === 'continuous' ? (
            // Continuous Vertical Scroll Mode
            pagesMeta.map((page, idx) => (
              <PdfPageCanvas
                key={`${page.pageIndex}-${idx}`}
                pageMeta={page}
                pdfJsDoc={pdfJsDoc}
                zoom={zoom}
                activeTool={activeTool}
                annotations={annotations}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={setSelectedAnnotationId}
                onAddAnnotation={handleAddAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                searchQuery={searchQuery}
                isCurrentPage={currentPage === idx + 1}
              />
            ))
          ) : (
            // Single Page View Mode
            currentPageMeta && (
              <PdfPageCanvas
                pageMeta={currentPageMeta}
                pdfJsDoc={pdfJsDoc}
                zoom={zoom}
                activeTool={activeTool}
                annotations={annotations}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={setSelectedAnnotationId}
                onAddAnnotation={handleAddAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                searchQuery={searchQuery}
                isCurrentPage={true}
              />
            )
          )}
        </main>

        {/* Right Contextual Properties Panel */}
        <PdfPropertiesPanel
          selectedAnnotation={selectedAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          currentPageMeta={currentPageMeta}
          activeTool={activeTool}
          isCollapsed={isRightSidebarCollapsed}
          onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        />
      </div>

      {/* 3. SIMULATOR FOOTER BAR (Preserved for Demo / Testing Access) */}
      <footer className="bg-[#0B0F19] border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#D8B4FE] font-bold">VSS Pro PDF Studio</span>
          <span>•</span>
          <span>In-Browser Vector Engine (pdf-lib &amp; pdf.js)</span>
          <span>•</span>
          <span className="hidden sm:inline">100% Client-Side Private Document Processing</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">Access Gate Simulator:</span>
          <button
            type="button"
            onClick={() => {
              setOverrideCount(1);
              showToast('Switched to 1/5 Weekly Uploads (Gate Preview Active)', 'info');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
              overrideCount === 1 ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Lock Studio (1/5 Demo)
          </button>
          <button
            type="button"
            onClick={() => {
              setOverrideCount(5);
              showToast('5/5 Weekly Uploads: Access Unlocked ✓', 'success');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
              overrideCount === 5 || overrideCount === null ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            5/5 (Unlocked ✓)
          </button>
        </div>
      </footer>
    </div>
  );
}
