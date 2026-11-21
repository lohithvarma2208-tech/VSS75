'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  ActiveStudioTool,
  AnyAnnotation,
  TextAnnotation,
  TextReplaceAnnotation,
  ShapeAnnotation,
  DrawAnnotation,
  HighlightAnnotation,
  SignatureAnnotation,
  StampAnnotation,
  PageMeta,
} from './types';

interface PdfPageCanvasProps {
  pageMeta: PageMeta;
  pdfJsDoc: any; // PDFDocumentProxy from pdfjs-dist
  zoom: number;
  activeTool: ActiveStudioTool;
  annotations: AnyAnnotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onAddAnnotation: (annotation: AnyAnnotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<AnyAnnotation>) => void;
  searchQuery?: string;
  isCurrentPage?: boolean;
}

export default function PdfPageCanvas({
  pageMeta,
  pdfJsDoc,
  zoom,
  activeTool,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation,
  onUpdateAnnotation,
  searchQuery = '',
  isCurrentPage = false,
}: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [pageViewport, setPageViewport] = useState<any>(null);
  const [textItems, setTextItems] = useState<{ str: string; x: number; y: number; width: number; height: number }[]>([]);
  const [isRendering, setIsRendering] = useState(true);

  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[]>([]);

  // Dragging / Moving annotation state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; origX: number; origY: number } | null>(null);

  // Render the PDF page with pdfjs-dist
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfJsDoc) return;
      try {
        setIsRendering(true);
        const page = await pdfJsDoc.getPage(pageMeta.pageIndex + 1);
        if (isCancelled) return;

        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        // High-DPI scale for ultra-sharp rendering
        const baseScale = zoom;
        const viewport = page.getViewport({ scale: baseScale });
        setPageViewport(viewport);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Render at high-DPI
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        await page.render(renderContext).promise;

        // Extract text items for in-document text search & selection
        const textContent = await page.getTextContent();
        if (!isCancelled && textContent && textContent.items) {
          const items = textContent.items.map((item: any) => {
            const tx = item.transform;
            // PDF coordinates to viewport coordinates
            const x = tx[4] * (viewport.width / page.view[2]);
            const y = viewport.height - tx[5] * (viewport.height / page.view[3]);
            return {
              str: item.str,
              x,
              y: y - (item.height || 12),
              width: item.width * baseScale,
              height: (item.height || 12) * baseScale,
            };
          });
          setTextItems(items);
        }

        setIsRendering(false);
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn('PDF render error:', err);
        }
        setIsRendering(false);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfJsDoc, pageMeta.pageIndex, zoom, pageMeta.rotation]);

  // Dimensions in CSS pixels based on current zoom
  const displayWidth = pageViewport ? pageViewport.width : pageMeta.width * zoom;
  const displayHeight = pageViewport ? pageViewport.height : pageMeta.height * zoom;
  const scaleRatio = zoom;

  // Filter annotations for this specific page
  const pageAnnotations = useMemo(() => {
    return annotations.filter((a) => a.pageIndex === pageMeta.pageIndex);
  }, [annotations, pageMeta.pageIndex]);

  // --- MOUSE CLICK ON CANVAS TO PLACE OR DRAW ---
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || activeTool === 'hand') return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert display coordinates to PDF points (72 DPI)
    const pdfX = clientX / scaleRatio;
    const pdfY = clientY / scaleRatio;

    // 1. Add Text Box
    if (activeTool === 'text') {
      const newText: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: 'text',
        pageIndex: pageMeta.pageIndex,
        x: pdfX,
        y: pdfY,
        width: 140,
        height: 36,
        text: 'Type text here...',
        fontSize: 14,
        fontFamily: 'Helvetica',
        color: '#0F172A',
        isBold: false,
        isItalic: false,
        align: 'left',
        opacity: 1,
      };
      onAddAnnotation(newText);
      onSelectAnnotation(newText.id);
      return;
    }

    // 2. Text Replace / Redaction Mask
    if (activeTool === 'text-replace') {
      const newReplace: TextReplaceAnnotation = {
        id: `replace-${Date.now()}`,
        type: 'text-replace',
        pageIndex: pageMeta.pageIndex,
        x: pdfX,
        y: pdfY,
        width: 120,
        height: 24,
        replacementText: 'Corrected Text',
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#000000',
        maskColor: '#ffffff',
      };
      onAddAnnotation(newReplace);
      onSelectAnnotation(newReplace.id);
      return;
    }

    // 3. Highlight Box
    if (activeTool === 'highlight') {
      const newHighlight: HighlightAnnotation = {
        id: `hl-${Date.now()}`,
        type: 'highlight',
        pageIndex: pageMeta.pageIndex,
        x: pdfX,
        y: pdfY,
        width: 120,
        height: 18,
        color: '#fef08a',
        opacity: 0.45,
      };
      onAddAnnotation(newHighlight);
      onSelectAnnotation(newHighlight.id);
      return;
    }

    // 4. Rectangle Shape
    if (activeTool === 'rectangle') {
      const newRect: ShapeAnnotation = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        shapeType: 'rectangle',
        pageIndex: pageMeta.pageIndex,
        x: pdfX,
        y: pdfY,
        width: 110,
        height: 60,
        strokeColor: '#8B5CF6',
        strokeWidth: 2,
        opacity: 1,
      };
      onAddAnnotation(newRect);
      onSelectAnnotation(newRect.id);
      return;
    }

    // 5. Stamp
    if (activeTool === 'stamp') {
      const newStamp: StampAnnotation = {
        id: `stamp-${Date.now()}`,
        type: 'stamp',
        pageIndex: pageMeta.pageIndex,
        stampType: 'VERIFIED',
        x: pdfX,
        y: pdfY,
        scale: 1,
      };
      onAddAnnotation(newStamp);
      onSelectAnnotation(newStamp.id);
      return;
    }

    // 6. Freehand Drawing (Pen)
    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentDrawPoints([{ x: pdfX, y: pdfY }]);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handling freehand drawing
    if (isDrawing && activeTool === 'draw') {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pdfX = (e.clientX - rect.left) / scaleRatio;
      const pdfY = (e.clientY - rect.top) / scaleRatio;
      setCurrentDrawPoints((prev) => [...prev, { x: pdfX, y: pdfY }]);
    }

    // Handling annotation dragging
    if (draggingId && dragStart) {
      const deltaX = (e.clientX - dragStart.x) / scaleRatio;
      const deltaY = (e.clientY - dragStart.y) / scaleRatio;
      onUpdateAnnotation(draggingId, {
        x: Math.max(0, dragStart.origX + deltaX),
        y: Math.max(0, dragStart.origY + deltaY),
      });
    }
  };

  const handleOverlayMouseUp = () => {
    if (isDrawing && currentDrawPoints.length > 1) {
      const newDraw: DrawAnnotation = {
        id: `draw-${Date.now()}`,
        type: 'draw',
        pageIndex: pageMeta.pageIndex,
        points: currentDrawPoints,
        color: '#0F172A',
        strokeWidth: 2.5,
        opacity: 1,
      };
      onAddAnnotation(newDraw);
      setIsDrawing(false);
      setCurrentDrawPoints([]);
    }

    if (draggingId) {
      setDraggingId(null);
      setDragStart(null);
    }
  };

  // Start dragging an annotation
  const startDragAnnotation = (e: React.MouseEvent, annot: AnyAnnotation) => {
    e.stopPropagation();
    onSelectAnnotation(annot.id);
    if ('x' in annot && 'y' in annot) {
      setDraggingId(annot.id);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        origX: annot.x ?? 0,
        origY: annot.y ?? 0,
      });
    }
  };

  return (
    <div
      className={`relative mx-auto my-4 transition-shadow bg-white rounded-lg overflow-hidden shadow-2xl ${
        isCurrentPage ? 'ring-2 ring-purple-500/80' : 'ring-1 ring-slate-200'
      }`}
      style={{ width: displayWidth, height: displayHeight }}
    >
      {/* Background HTML5 Canvas rendered by pdfjs-dist */}
      <canvas ref={canvasRef} className="absolute inset-0 block select-none pointer-events-none" />

      {/* Loading Skeleton */}
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono">
            <span className="w-3 h-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
            <span>Rendering Page {pageMeta.pageIndex + 1}...</span>
          </div>
        </div>
      )}

      {/* Search Matches Highlight Layer */}
      {searchQuery && searchQuery.length > 1 && (
        <div className="absolute inset-0 pointer-events-none z-15">
          {textItems.map((item, idx) => {
            if (item.str.toLowerCase().includes(searchQuery.toLowerCase())) {
              return (
                <div
                  key={idx}
                  className="absolute bg-purple-500/50 border border-purple-500 rounded-sm pointer-events-none animate-pulse"
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    width: `${Math.max(20, item.width)}px`,
                    height: `${Math.max(14, item.height)}px`,
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Interactive Annotation & Drawing Overlay Layer */}
      <div
        ref={overlayRef}
        onMouseDown={handleOverlayMouseDown}
        onMouseMove={handleOverlayMouseMove}
        onMouseUp={handleOverlayMouseUp}
        className={`absolute inset-0 z-20 ${
          activeTool === 'select'
            ? 'cursor-default'
            : activeTool === 'draw'
            ? 'cursor-crosshair'
            : activeTool === 'text' || activeTool === 'text-replace'
            ? 'cursor-text'
            : 'cursor-crosshair'
        }`}
      >
        {/* Render Saved Annotations */}
        {pageAnnotations.map((annot) => {
          const isSelected = selectedAnnotationId === annot.id;
          const annotObj = annot as any;
          const left = (annotObj.x || 0) * scaleRatio;
          const top = (annotObj.y || 0) * scaleRatio;
          const width = (annotObj.width || 120) * scaleRatio;
          const height = (annotObj.height || 30) * scaleRatio;

          // 1. Text Annotation
          if (annot.type === 'text') {
            return (
              <div
                key={annot.id}
                onMouseDown={(e) => startDragAnnotation(e, annot)}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  color: annot.color,
                  fontSize: `${(annot.fontSize || 14) * scaleRatio}px`,
                  fontFamily: annot.fontFamily || 'Helvetica',
                  fontWeight: annot.isBold ? 'bold' : 'normal',
                  fontStyle: annot.isItalic ? 'italic' : 'normal',
                  opacity: annot.opacity || 1,
                  backgroundColor: annot.backgroundColor || 'transparent',
                }}
                className={`absolute p-1 cursor-move transition select-none flex items-center ${
                  isSelected ? 'ring-2 ring-purple-500 shadow-lg rounded-md bg-white/40' : 'hover:ring-1 hover:ring-slate-400'
                }`}
              >
                <textarea
                  value={annot.text}
                  onChange={(e) => onUpdateAnnotation(annot.id, { text: e.target.value })}
                  className="w-full h-full bg-transparent resize-none border-0 outline-none p-0"
                />
              </div>
            );
          }

          // 2. Text Replace & Redaction (Whiteout mask over original text with replacement)
          if (annot.type === 'text-replace') {
            return (
              <div
                key={annot.id}
                onMouseDown={(e) => startDragAnnotation(e, annot)}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: annot.maskColor || '#ffffff',
                }}
                className={`absolute p-1 cursor-move select-none shadow-sm flex items-center ${
                  isSelected ? 'ring-2 ring-purple-500' : 'border border-slate-300'
                }`}
              >
                <input
                  type="text"
                  value={annot.replacementText}
                  onChange={(e) => onUpdateAnnotation(annot.id, { replacementText: e.target.value })}
                  style={{
                    color: annot.color || '#000000',
                    fontSize: `${(annot.fontSize || 12) * scaleRatio}px`,
                    fontFamily: annot.fontFamily || 'Helvetica',
                  }}
                  className="w-full bg-transparent border-0 outline-none font-bold"
                />
              </div>
            );
          }

          // 3. Highlight Annotation
          if (annot.type === 'highlight') {
            return (
              <div
                key={annot.id}
                onMouseDown={(e) => startDragAnnotation(e, annot)}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: annot.color,
                  opacity: annot.opacity || 0.45,
                }}
                className={`absolute rounded cursor-move mix-blend-multiply ${
                  isSelected ? 'ring-2 ring-indigo-500' : ''
                }`}
              />
            );
          }

          // 4. Shape Annotation (Rectangle)
          if (annot.type === 'shape' && annot.shapeType === 'rectangle') {
            return (
              <div
                key={annot.id}
                onMouseDown={(e) => startDragAnnotation(e, annot)}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  borderColor: annot.strokeColor,
                  borderWidth: `${(annot.strokeWidth || 2) * scaleRatio}px`,
                  backgroundColor: annot.fillColor || 'transparent',
                  opacity: annot.opacity || 1,
                }}
                className={`absolute border rounded cursor-move ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
              />
            );
          }

          // 5. Freehand Drawings
          if (annot.type === 'draw' && annot.points.length > 1) {
            const pathData = annot.points
              .map((pt, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${pt.x * scaleRatio} ${pt.y * scaleRatio}`)
              .join(' ');
            return (
              <svg key={annot.id} className="absolute inset-0 pointer-events-none w-full h-full">
                <path
                  d={pathData}
                  stroke={annot.color}
                  strokeWidth={(annot.strokeWidth || 2) * scaleRatio}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={annot.opacity || 1}
                />
              </svg>
            );
          }

          // 6. Signature Annotation
          if (annot.type === 'signature' && annot.dataUrl) {
            return (
              <div
                key={annot.id}
                onMouseDown={(e) => startDragAnnotation(e, annot)}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width || 160}px`,
                  height: `${height || 60}px`,
                }}
                className={`absolute cursor-move p-1 ${isSelected ? 'ring-2 ring-purple-500 rounded-lg' : ''}`}
              >
                <img src={annot.dataUrl} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
              </div>
            );
          }

          // 7. Stamp
          if (annot.type === 'stamp') {
            return (
              <div
                key={annot.id}
                onMouseDown={(e) => startDragAnnotation(e, annot)}
                style={{ left: `${left}px`, top: `${top}px` }}
                className={`absolute cursor-move p-2.5 rounded-xl border-2 font-black uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-md ${
                  annot.stampType === 'APPROVED'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-purple-400 bg-[#0B0F19] text-[#D8B4FE]'
                } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <span>✓ {annot.stampType === 'APPROVED' ? 'APPROVED FOR SUBMISSION' : 'VERIFIED KLEF STUDENT'}</span>
              </div>
            );
          }

          return null;
        })}

        {/* Real-time Freehand Drawing stroke preview */}
        {isDrawing && currentDrawPoints.length > 1 && (
          <svg className="absolute inset-0 pointer-events-none w-full h-full">
            <path
              d={currentDrawPoints
                .map((pt, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${pt.x * scaleRatio} ${pt.y * scaleRatio}`)
                .join(' ')}
              stroke="#0F172A"
              strokeWidth={2.5 * scaleRatio}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
