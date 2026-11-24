import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-14 w-14 text-base'
        : 'h-9 w-9 text-xs';

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={cn(
          'rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100',
          sizeClass,
          className
        )}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold shrink-0',
        sizeClass,
        className
      )}
    >
      {initials || 'HR'}
    </div>
  );
}
