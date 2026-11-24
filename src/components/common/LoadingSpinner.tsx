import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  label = 'Loading data...',
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-2.5 py-10 text-slate-500', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn('animate-spin text-indigo-700', iconSize)} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}
