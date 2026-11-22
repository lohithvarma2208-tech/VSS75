'use client';

import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  studentId?: string;
}

export function VerifiedBadge({
  size = 'sm',
  showLabel = true,
  className = '',
}: VerifiedBadgeProps) {
  if (size === 'xs') {
    return (
      <span
        title="Verified Campus Student (Official institutional email confirmed)"
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[#D8B4FE] text-[9px] font-mono font-bold tracking-tight shadow-[0_0_8px_rgba(168,85,247,0.2)] ${className}`}
      >
        <ShieldCheck className="h-2.5 w-2.5 text-[#38BDF8] shrink-0" />
        {showLabel && <span>Verified</span>}
      </span>
    );
  }

  if (size === 'sm') {
    return (
      <span
        title="Verified Campus Student (Official institutional email confirmed)"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/15 to-sky-500/15 border border-purple-500/40 text-[#D8B4FE] text-[10px] font-mono font-bold tracking-tight shadow-[0_0_10px_rgba(168,85,247,0.2)] ${className}`}
      >
        <ShieldCheck className="h-3 w-3 text-[#38BDF8] shrink-0" />
        {showLabel && <span>Verified Scholar</span>}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-500/20 via-sky-500/15 to-transparent border border-purple-500/50 text-[#D8B4FE] text-xs font-mono font-bold shadow-[0_0_15px_rgba(168,85,247,0.25)] ${className}`}
      >
        <div className="h-5 w-5 rounded-full bg-purple-500/25 flex items-center justify-center border border-purple-500/40">
          <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8]" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white text-xs font-black tracking-tight leading-tight">
            Verified Campus Scholar
          </span>
          <span className="text-[10px] text-[#D8B4FE]/80 font-mono font-medium">
            Institutional Email Confirmed
          </span>
        </div>
      </div>
    );
  }

  // Default 'md'
  return (
    <span
      title="Verified Campus Student (Official institutional email confirmed)"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-sky-500/20 border border-purple-500/50 text-[#D8B4FE] text-xs font-mono font-bold tracking-tight shadow-[0_0_12px_rgba(168,85,247,0.2)] ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8] shrink-0" />
      {showLabel && <span>Verified Campus Scholar</span>}
    </span>
  );
}
