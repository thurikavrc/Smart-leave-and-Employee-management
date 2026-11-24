import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Button } from '@/src/components/ui/button';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { cn } from '@/src/lib/utils';

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors cursor-pointer"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-700 px-1 text-[11px] font-semibold text-white tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <p className="text-xs text-slate-500 tabular-nums">
              {unreadCount} unread {unreadCount === 1 ? 'update' : 'updates'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          ) : (
            recentNotifications.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50',
                  !item.isRead && 'bg-indigo-50/40'
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!item.isRead) {
                      markAsRead(item.id);
                    }
                    if (item.actionUrl) {
                      navigate(item.actionUrl);
                    }
                  }}
                  className="flex-1 text-left cursor-pointer"
                >
                  <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{item.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </button>
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    title="Mark as read"
                    aria-label="Mark notification as read"
                    className="mt-0.5 rounded-md p-1 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 p-2 bg-slate-50/60">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-indigo-700 hover:text-indigo-800"
            onClick={() => navigate('/notifications')}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
