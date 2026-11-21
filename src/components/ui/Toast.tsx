'use client';

import React from 'react';
import { useApp } from '@/lib/context/AppContext';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const config = {
    success: {
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
      border: 'border-emerald-500/40 bg-[#0B0F19]/95 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    error: {
      icon: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />,
      border: 'border-rose-500/40 bg-[#0B0F19]/95 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.25)]',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    info: {
      icon: <Sparkles className="h-4 w-4 text-[#38BDF8] shrink-0 animate-pulse" />,
      border: 'border-purple-500/40 bg-[#0B0F19]/95 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.25)]',
      badge: 'bg-purple-500/20 text-[#D8B4FE] border border-purple-500/30',
    },
  };

  const current = config[toast.type] || config.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
      <div
        className={`flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl border backdrop-blur-xl ${current.border}`}
      >
        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
          {current.icon}
        </div>
        <p className="text-xs font-bold text-white tracking-wide pr-1">{toast.message}</p>
      </div>
    </div>
  );
}
