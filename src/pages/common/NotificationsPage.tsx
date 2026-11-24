import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/common/EmptyState';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatRelativeTime } from '@/src/utils/dateUtils';
import { cn } from '@/src/lib/utils';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const visibleNotifications =
    filter === 'UNREAD'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Notifications' }]}
      title="Notifications"
      subtitle="Stay updated on leave applications, manager approvals, rejections, and HR updates."
      actions={
        unreadCount > 0 ? (
          <Button variant="outline" onClick={() => markAllAsRead()}>
            <CheckCheck className="h-4 w-4" />
            <span>Mark all as read</span>
          </Button>
        ) : undefined
      }
    >
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'ALL' | 'UNREAD')}>
          <TabsList>
            <TabsTrigger value="ALL">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="UNREAD">Unread ({unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading notifications..." />
      ) : visibleNotifications.length === 0 ? (
        <EmptyState
          title={filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
          description="You are up to date with all leave and workforce notifications."
          icon={Bell}
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-slate-100">
            {visibleNotifications.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors',
                  !item.isRead && 'bg-indigo-50/35'
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      item.isRead
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-indigo-100 text-indigo-700'
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      {!item.isRead && (
                        <span className="text-[11px] font-semibold text-indigo-700">
                          Unread
                        </span>
                      )}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(item.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Mark read</span>
                    </Button>
                  )}
                  {item.actionUrl && item.actionUrl !== '/notifications' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!item.isRead) markAsRead(item.id);
                        navigate(item.actionUrl!);
                      }}
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
