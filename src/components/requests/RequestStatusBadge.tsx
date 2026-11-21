'use client';

import React from 'react';
import { RequestStatus } from '@/types';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export function RequestStatusBadge({ status, size = 'sm' }: RequestStatusBadgeProps) {
  const configs: Record<
    RequestStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    open: {
      label: 'Open Request',
      icon: <Clock className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
      bg: 'bg-amber-400/10',
      text: 'text-amber-300',
      border: 'border-amber-400/30',
    },
    partially_fulfilled: {
      label: 'Partially Fulfilled',
      icon: <AlertCircle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
      bg: 'bg-sky-400/10',
      text: 'text-sky-300',
      border: 'border-sky-400/30',
    },
    fulfilled: {
      label: 'Fulfilled',
      icon: <CheckCircle2 className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
      bg: 'bg-purple-500/15',
      text: 'text-[#D8B4FE]',
      border: 'border-purple-500/40',
    },
    closed: {
      label: 'Closed',
      icon: <XCircle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />,
      bg: 'bg-white/10',
      text: 'text-white/50',
      border: 'border-white/20',
    },
  };

  const current = configs[status] || configs.open;
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight border backdrop-blur-sm ${current.bg} ${current.text} ${current.border} ${padding}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
}
