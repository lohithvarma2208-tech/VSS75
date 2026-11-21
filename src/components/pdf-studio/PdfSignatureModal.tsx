'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, PenTool, Type, Upload, Trash2, Check, Sparkles } from 'lucide-react';

interface PdfSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
  defaultName?: string;
}

export default function PdfSignatureModal({
  isOpen,
  onClose,
  onSaveSignature,
  defaultName = 'SHADOW_SCHOLAR_01',
}: PdfSignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');

  // Draw State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState<'#0F172A' | '#1e3a8a' | '#000000'>('#0F172A');

  // Type State
  const [typedName, setTypedName] = useState(defaultName);
  const [fontChoice, setFontChoice] = useState<'cursive' | 'serif' | 'script'>('cursive');

  // Upload State
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = inkColor;
      }
    }
  }, [activeTab, inkColor, isOpen]);

  if (!isOpen) return null;

  // Drawing Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  // Convert Typed Name to Canvas Data URL
  const generateTypedSignatureDataUrl = (): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 400;
    offscreen.height = 120;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = inkColor;

    if (fontChoice === 'cursive') {
      ctx.font = 'italic bold 36px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    } else if (fontChoice === 'script') {
      ctx.font = 'italic 34px "Lucida Handwriting", "Apple Chancery", cursive';
    } else {
      ctx.font = 'italic bold 32px "Georgia", serif';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, offscreen.width / 2, offscreen.height / 2);

    // Decorative underline loop
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(offscreen.width / 2 - 120, offscreen.height / 2 + 25);
    ctx.bezierCurveTo(
      offscreen.width / 2,
      offscreen.height / 2 + 35,
      offscreen.width / 2 + 80,
      offscreen.height / 2 + 20,
      offscreen.width / 2 + 130,
      offscreen.height / 2 + 28
    );
    ctx.stroke();

    return offscreen.toDataURL('image/png');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (activeTab === 'draw') {
      if (!canvasRef.current || !hasDrawn) return;
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSignature(dataUrl);
    } else if (activeTab === 'type') {
      if (!typedName.trim()) return;
      const dataUrl = generateTypedSignatureDataUrl();
      onSaveSignature(dataUrl);
    } else if (activeTab === 'upload') {
      if (!uploadedUrl) return;
      onSaveSignature(uploadedUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0D1527] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-mono font-bold border border-purple-500/30">
              DIGITAL SIGNATURE
            </span>
          </div>
          <h3 className="text-xl font-black text-white">Create Verified Signature</h3>
          <p className="text-xs text-white/60 mt-0.5">
            Draw, type, or upload your academic endorsement to stamp onto documents.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[#0B0F19] border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'draw'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>Draw</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'type'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Type</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab 1: Draw Canvas */}
        {activeTab === 'draw' && (
          <div className="space-y-3">
            <div className="relative border-2 border-dashed border-white/20 rounded-2xl bg-white p-1">
              <canvas
                ref={canvasRef}
                width={440}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none rounded-xl bg-slate-50"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                  Sign here using mouse or finger...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              {/* Color choices */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/50">Ink Color:</span>
                <button
                  type="button"
                  onClick={() => setInkColor('#0F172A')}
                  className={`w-5 h-5 rounded-full bg-slate-900 border ${
                    inkColor === '#0F172A' ? 'border-purple-400 ring-2 ring-purple-500/40' : 'border-white/30'
                  }`}
                  title="Dark Ink"
                />
                <button
                  type="button"
                  onClick={() => setInkColor('#1e3a8a')}
                  className={`w-5 h-5 rounded-full bg-blue-900 border ${
                    inkColor === '#1e3a8a' ? 'border-purple-400 ring-2 ring-purple-500/40' : 'border-white/30'
                  }`}
                  title="Official Blue"
                />
                <button
                  type="button"
                  onClick={() => setInkColor('#000000')}
                  className={`w-5 h-5 rounded-full bg-black border ${
                    inkColor === '#000000' ? 'border-purple-400 ring-2 ring-purple-500/40' : 'border-white/30'
                  }`}
                  title="Deep Black"
                />
              </div>

              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-300 hover:text-rose-200 transition flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Canvas</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Type Signature */}
        {activeTab === 'type' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Enter Digital Alias / Code Name
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="e.g. SHADOW_SCHOLAR_01"
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Font Previews */}
            <div className="space-y-2">
              <span className="text-[11px] text-white/60 block">Choose Calligraphy Style:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFontChoice('cursive')}
                  className={`p-3 rounded-xl border text-center transition ${
                    fontChoice === 'cursive'
                      ? 'bg-purple-500/15 border-purple-500 text-[#D8B4FE]'
                      : 'bg-[#0B0F19] border-white/10 text-white/80 hover:border-white/30'
                  }`}
                >
                  <span className="text-base italic font-serif block truncate font-bold">
                    {typedName || 'Signature'}
                  </span>
                  <span className="text-[10px] text-white/40 block mt-1">Script Casual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFontChoice('script')}
                  className={`p-3 rounded-xl border text-center transition ${
                    fontChoice === 'script'
                      ? 'bg-purple-500/15 border-purple-500 text-[#D8B4FE]'
                      : 'bg-[#0B0F19] border-white/10 text-white/80 hover:border-white/30'
                  }`}
                >
                  <span className="text-base italic font-serif block truncate">
                    {typedName || 'Signature'}
                  </span>
                  <span className="text-[10px] text-white/40 block mt-1">Handwriting</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFontChoice('serif')}
                  className={`p-3 rounded-xl border text-center transition ${
                    fontChoice === 'serif'
                      ? 'bg-purple-500/15 border-purple-500 text-[#D8B4FE]'
                      : 'bg-[#0B0F19] border-white/10 text-white/80 hover:border-white/30'
                  }`}
                >
                  <span className="text-sm italic font-serif block truncate font-bold">
                    {typedName || 'Signature'}
                  </span>
                  <span className="text-[10px] text-white/40 block mt-1">Classic Formal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Upload Image */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-6 cursor-pointer bg-[#0B0F19]/60 transition">
              <Upload className="h-8 w-8 text-[#D8B4FE] mb-2" />
              <span className="text-xs font-bold text-white">Upload transparent PNG or JPG signature</span>
              <span className="text-[10px] text-white/50 mt-1">Max file size 5MB</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {uploadedUrl && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="w-32 h-14 bg-white rounded-lg p-1 flex items-center justify-center">
                  <img src={uploadedUrl} alt="Signature preview" className="max-h-full max-w-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedUrl(null)}
                  className="text-xs text-rose-300 hover:text-rose-200"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-black shadow-md shadow-indigo-500/25 transition active:scale-95 flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Apply Signature to Document</span>
          </button>
        </div>
      </div>
    </div>
  );
}
