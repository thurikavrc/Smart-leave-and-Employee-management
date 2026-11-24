import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  tone?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}

const TONE_STYLES: Record<NonNullable<DashboardCardProps['tone']>, string> = {
  indigo: 'bg-indigo-50 text-indigo-700',
  blue: 'bg-sky-50 text-sky-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
};

export function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  tone = 'indigo',
  onClick,
}: DashboardCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border border-slate-200 bg-white p-5 transition-colors',
        onClick && 'hover:border-indigo-300 hover:bg-slate-50/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONE_STYLES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium tabular-nums shrink-0',
                trend.isPositive ? 'text-emerald-700' : 'text-red-700'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
}
