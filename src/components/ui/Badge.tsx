import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'amber';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    primary: 'bg-klu-50 text-klu-800 border border-klu-200/70',
    secondary: 'bg-indigo-50 text-indigo-800 border border-indigo-200/70',
    outline: 'border border-slate-200 text-slate-600 bg-white',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/70',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
